import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { sendPasswordResetOtpEmail, generateOtpCode, hashOtp } from '../services/mailService.js';
import { getUserBookingProfile } from '../services/bookingService.js';
import {
  assessCccdImageSuitability,
  chooseBestDetectedName,
  namesAreEquivalent,
  scanCccdImage,
} from '../services/cccdVerificationService.js';
import { compareFaceWithCccd } from '../services/faceVerificationService.js';
import { signAccessToken } from '../services/tokenService.js';
import {
  validateLoginPayload,
  validateRegisterPayload,
  validateResetPasswordWithOtpPayload,
  validateSendResetOtpPayload,
  validateVerifyCccdPayload,
} from '../validators/authValidator.js';

// Tạo object lỗi có kèm mã HTTP để middleware xử lý thống nhất.
function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Chuyển ảnh dạng data URL từ frontend thành buffer nhị phân để service xử lý ảnh.
function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

// Chuyển dữ liệu ảnh dạng buffer ngược lại thành data URL để lưu hoặc trả về client.
function buildImageDataUrl({ mimeType, buffer }) {
  if (!mimeType || !buffer) {
    return '';
  }

  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

// Tính điểm chi tiết cho từng tiêu chí xác minh CCCD/khuôn mặt.
function getVerificationBreakdown(userLike) {
  const nameMatched = Boolean(userLike?.cccdNameMatched);
  const faceMatched = Boolean(userLike?.faceMatched);
  const faceSimilarityScore = Number(userLike?.faceMatchScore || 0);

  return {
    nameMatched,
    faceMatched,
    nameScore: nameMatched ? 40 : 0,
    faceScore: faceMatched ? 40 : 0,
    totalScore: (nameMatched ? 40 : 0) + (faceMatched ? 40 : 0),
    faceSimilarityScore,
    faceMatchThreshold: 50,
  };
}

// Ưu tiên đọc file upload thật từ multipart/form-data; nếu không có thì fallback sang data URL.
function readUploadedImage(request, fieldName, fallbackDataUrl) {
  const file = request.files?.[fieldName]?.[0];
  if (file?.buffer) {
    return {
      buffer: file.buffer,
      mimeType: file.mimetype || 'image/jpeg',
    };
  }

  return dataUrlToBuffer(fallbackDataUrl);
}

// Sinh thông điệp phản hồi cho người dùng dựa trên điểm xác minh.
function buildVerificationMessage(verificationBreakdown) {
  if (verificationBreakdown.totalScore >= 80) {
    return 'Xác thực CCCD và đối sánh khuôn mặt thành công';
  }

  return 'Đã đối chiếu họ tên trên CCCD, nhưng khuôn mặt chưa đạt ngưỡng 50% để hoàn tất xác thực đầy đủ';
}

// Tạo payload đăng nhập/đăng ký trả về gồm JWT, hồ sơ người dùng và trạng thái xác minh.
async function createAuthResponse(user) {
  // Lấy thêm thống kê booking để frontend biết người dùng có phải khách thân thiết hay không.
  const bookingProfile = await getUserBookingProfile(user._id);
  // Chuẩn hóa lại điểm xác minh để không phụ thuộc hoàn toàn vào document gốc.
  const verificationBreakdown = getVerificationBreakdown(user);
  // Tạo access token cho các request tiếp theo.
  const token = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      fullName: user.name,
      username: user.username || null,
      email: user.email,
      phone: user.phone || '',
      isActive: Boolean(user.isActive !== false),
      cccdNumber: user.cccdNumber || null,
      cccdImageDataUrl: user.cccdImageDataUrl || '',
      faceImageDataUrl: user.faceImageDataUrl || '',
      isCccdVerified: Boolean(user.isCccdVerified),
      cccdNameMatched: verificationBreakdown.nameMatched,
      faceMatched: verificationBreakdown.faceMatched,
      faceMatchScore: verificationBreakdown.faceSimilarityScore,
      verificationBreakdown,
      trustScore: Number(user.trustScore || 0),
      successfulBookingCount: bookingProfile.successfulBookingCount,
      isLoyalGuest: bookingProfile.isLoyalGuest,
      role: user.role,
    },
  };
}

// Đăng ký tài khoản mới.
export async function register(request, response, next) {
  try {
    // Kiểm tra dữ liệu đầu vào theo validator chuyên biệt.
    const validation = validateRegisterPayload(request.body);

    if (!validation.valid) {
      throw createHttpError(validation.errors[0], 400);
    }

    // Lấy dữ liệu đã được validator chuẩn hóa.
    const { fullName, username, phone, email, password } = validation.data;
    // Kiểm tra email hoặc username đã tồn tại hay chưa.
    const existingUser = await User.findOne({
      $or: [{ email }, ...(username ? [{ username }] : [])],
    }).lean();

    if (existingUser) {
      throw createHttpError('Email hoặc username đã tồn tại', 409);
    }

    // Băm mật khẩu trước khi lưu vào database.
    const passwordHash = await bcrypt.hash(password, 10);
    // Nếu hệ thống chưa có admin nào thì tài khoản đầu tiên sẽ trở thành admin.
    const adminCount = await User.countDocuments({ role: { $in: ['admin', 'ADMIN'] } });
    // Tạo user mới với các giá trị mặc định ban đầu.
    const user = await User.create({
      name: fullName,
      username: username || undefined,
      phone: phone || '',
      email,
      passwordHash,
      role: adminCount === 0 ? 'admin' : 'member',
      trustScore: 0,
      isCccdVerified: false,
    });

    // Trả về token cùng hồ sơ vừa tạo để frontend có thể đăng nhập ngay sau khi đăng ký.
    response.status(201).json(await createAuthResponse(user));
  } catch (error) {
    // Chuyển lỗi cho middleware xử lý lỗi chung.
    next(error);
  }
}

// Đăng nhập bằng email hoặc username.
export async function login(request, response, next) {
  try {
    // Validate dữ liệu đăng nhập trước khi truy vấn database.
    const validation = validateLoginPayload(request.body);

    if (!validation.valid) {
      throw createHttpError(validation.errors[0], 400);
    }

    // identifier có thể là email hoặc username.
    const { identifier, password } = validation.data;
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      // Không nói rõ sai email hay mật khẩu để tránh lộ thông tin tài khoản.
      throw createHttpError('Invalid email or password', 401);
    }

    // So sánh mật khẩu người dùng nhập với password hash đã lưu.
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw createHttpError('Invalid email or password', 401);
    }

    if (user.isActive === false) {
      // Chặn đăng nhập nếu tài khoản đã bị khóa bởi admin.
      throw createHttpError('Tài khoản đã bị khóa', 403);
    }

    // Trả token và hồ sơ người dùng để frontend lưu phiên làm việc.
    response.json(await createAuthResponse(user));
  } catch (error) {
    // Chuyển lỗi lên middleware chung.
    next(error);
  }
}

// Lấy hồ sơ hiện tại của người dùng đã đăng nhập.
export async function getProfile(request, response, next) {
  try {
    // Chỉ select các field cần thiết để tránh trả dữ liệu dư.
    const user = await User.findById(request.auth.userId).select(
      '_id name username email phone role isActive cccdNumber cccdImageDataUrl faceImageDataUrl isCccdVerified cccdNameMatched cccdNameVerifiedAt faceMatched faceMatchScore faceVerifiedAt idCardVerifiedAt trustScore',
    );

    if (!user) {
      throw createHttpError('User not found', 404);
    }

    // Lấy thêm thống kê booking và breakdown xác minh để frontend hiển thị đầy đủ hơn.
    const bookingProfile = await getUserBookingProfile(user._id);
    const verificationBreakdown = getVerificationBreakdown(user);

    // Trả hồ sơ đã chuẩn hóa cho client.
    response.json({
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        username: user.username || null,
        email: user.email,
        phone: user.phone || '',
        isActive: Boolean(user.isActive !== false),
        cccdNumber: user.cccdNumber || null,
        cccdImageDataUrl: user.cccdImageDataUrl || '',
        faceImageDataUrl: user.faceImageDataUrl || '',
        isCccdVerified: Boolean(user.isCccdVerified),
        cccdNameMatched: verificationBreakdown.nameMatched,
        cccdNameVerifiedAt: user.cccdNameVerifiedAt,
        faceMatched: verificationBreakdown.faceMatched,
        faceMatchScore: verificationBreakdown.faceSimilarityScore,
        faceVerifiedAt: user.faceVerifiedAt,
        verificationBreakdown,
        idCardVerifiedAt: user.idCardVerifiedAt,
        trustScore: Number(user.trustScore || 0),
        successfulBookingCount: bookingProfile.successfulBookingCount,
        isLoyalGuest: bookingProfile.isLoyalGuest,
        role: user.role,
      },
    });
  } catch (error) {
    // Chuyển lỗi lên middleware tập trung.
    next(error);
  }
}

// Xác minh CCCD và ảnh khuôn mặt của người dùng.
export async function verifyCccd(request, response, next) {
  try {
    // Validate payload cơ bản trước khi đụng tới xử lý ảnh.
    const validation = validateVerifyCccdPayload(request.body);

    if (!validation.valid) {
      throw createHttpError(validation.errors[0], 400);
    }

    // Lấy tài khoản hiện tại để đối chiếu tên và cập nhật trạng thái xác minh.
    const accountUser = await User.findById(request.auth.userId).select('_id name trustScore');
    if (!accountUser) {
      throw createHttpError('Không tìm thấy tài khoản cần xác minh', 404);
    }

    // Đọc ảnh CCCD và ảnh chân dung từ file upload hoặc data URL.
    const uploadedImage = readUploadedImage(request, 'cccdImage', validation.data.cccdImageDataUrl);
    const uploadedFaceImage = readUploadedImage(request, 'faceImage', validation.data.faceImageDataUrl);

    if (!uploadedImage?.buffer) {
      // Không có ảnh CCCD thì không thể bắt đầu quy trình OCR/xác minh.
      throw createHttpError('Vui lòng tải lên hình ảnh CCCD để xác minh', 400);
    }

    if (!uploadedFaceImage?.buffer) {
      // Ảnh chân dung dùng để so sánh khuôn mặt với CCCD.
      throw createHttpError('Vui lòng tải lên ảnh chân dung để đối sánh khuôn mặt với CCCD', 400);
    }

    // Đọc thông tin trên CCCD bằng service OCR/vision.
    const scanResult = await scanCccdImage(uploadedImage.buffer);
    // Đánh giá chất lượng ảnh để loại các trường hợp ảnh mờ, giả, thiếu góc chụp...
    const cccdAssessment = await assessCccdImageSuitability(uploadedImage.buffer, scanResult);

    if (!cccdAssessment.accepted) {
      throw createHttpError(`Ảnh CCCD không hợp lệ hoặc nghi ngờ không đúng: ${cccdAssessment.reasons[0]}`, 400);
    }

    // Chọn ra tên đọc được phù hợp nhất rồi so khớp với tên tài khoản hiện có.
    const extractedName = chooseBestDetectedName(accountUser.name, scanResult.detectedNames);
    const nameMatched = namesAreEquivalent(accountUser.name, extractedName);
    // Ưu tiên số CCCD người dùng nhập tay; nếu không có thì dùng số OCR trích xuất được.
    const cccdNumber = validation.data.cccdNumber || scanResult.detectedCccdNumber;
    // Lưu lại ảnh dưới dạng data URL để frontend có thể hiển thị lại dễ dàng.
    const cccdImageDataUrl = buildImageDataUrl(uploadedImage);
    const faceImageDataUrl = buildImageDataUrl(uploadedFaceImage);

    if (!extractedName) {
      throw createHttpError('Không đọc được họ và tên trên CCCD. Hãy tải ảnh rõ hơn', 400);
    }

    if (!nameMatched) {
      throw createHttpError(`Họ và tên trên CCCD (${extractedName}) không trùng với tên tài khoản (${accountUser.name})`, 400);
    }

    if (!cccdNumber) {
      throw createHttpError('Không đọc được số CCCD. Hãy nhập bổ sung số CCCD hoặc tải ảnh rõ hơn', 400);
    }
    // kiem tra xem số CCCD này đã được tài khoản khác sử dụng chưa (trừ chính tài khoản đang xác minh).
    const duplicated = await User.findOne({
      cccdNumber,
      _id: { $ne: request.auth.userId },
    }).lean();
    
    if (duplicated) {
      throw createHttpError('CCCD đã được sử dụng bởi tài khoản khác', 409);
    }

    // So sánh khuôn mặt trên ảnh chụp selfie với ảnh trên CCCD.
    const faceVerification = await compareFaceWithCccd({
      cccdBuffer: uploadedImage.buffer,
      selfieBuffer: uploadedFaceImage.buffer,
    });

    if (!faceVerification.accepted) {
      throw createHttpError(faceVerification.rejectionReason || 'Ảnh khuôn mặt không phù hợp để đối sánh', 400);
    }

    // Tổng hợp điểm xác minh cuối cùng từ 2 tiêu chí: tên và khuôn mặt.
    const verificationBreakdown = {
      nameMatched,
      faceMatched: Boolean(faceVerification.matched),
      nameScore: nameMatched ? 40 : 0,
      faceScore: faceVerification.matched ? 40 : 0,
      totalScore: (nameMatched ? 40 : 0) + (faceVerification.matched ? 40 : 0),
      faceSimilarityScore: Number(faceVerification.similarityScore || 0),
      faceMatchThreshold: Number(faceVerification.threshold || 50),
    };
    const now = new Date();

    // Cập nhật lại toàn bộ dữ liệu xác minh vào tài khoản.
    accountUser.cccdNumber = cccdNumber;
    accountUser.cccdImageDataUrl = cccdImageDataUrl;
    accountUser.faceImageDataUrl = faceImageDataUrl;
    accountUser.cccdNameMatched = nameMatched;
    accountUser.cccdNameVerifiedAt = nameMatched ? now : null;
    accountUser.faceMatched = Boolean(faceVerification.matched);
    accountUser.faceMatchScore = verificationBreakdown.faceSimilarityScore;
    accountUser.faceVerifiedAt = now;
    accountUser.isCccdVerified = verificationBreakdown.totalScore >= 80;
    accountUser.idCardVerifiedAt = accountUser.isCccdVerified ? now : null;
    accountUser.trustScore = Math.max(Number(accountUser.trustScore || 0), verificationBreakdown.totalScore);
    await accountUser.save();

    // Chuyển document sang object thuần để trả về response.
    const user = accountUser.toObject();

    if (!user) {
      throw createHttpError('Không tìm thấy tài khoản', 404);
    }

    // Trả kết quả xác minh chi tiết để frontend hiển thị cho người dùng.
    response.json({
      message: buildVerificationMessage(verificationBreakdown),
      cccdNumber: user.cccdNumber,
      cccdImageDataUrl: user.cccdImageDataUrl,
      faceImageDataUrl: user.faceImageDataUrl,
      trustScore: user.trustScore,
      verifiedAt: user.idCardVerifiedAt,
      cccdNameVerifiedAt: user.cccdNameVerifiedAt,
      faceVerifiedAt: user.faceVerifiedAt,
      extractedName,
      accountName: accountUser.name,
      nameMatched,
      faceMatched: verificationBreakdown.faceMatched,
      faceMatchScore: verificationBreakdown.faceSimilarityScore,
      verificationBreakdown,
      cccdQuality: cccdAssessment,
      faceMetrics: faceVerification.metrics,
    });
  } catch (error) {
    // Mọi lỗi từ validate, OCR hoặc so sánh khuôn mặt đều đi qua middleware chung.
    next(error);
  }
}

// Gửi mã OTP về email để người dùng đặt lại mật khẩu.
export async function sendPasswordResetOtp(request, response, next) {
  try {
    // Kiểm tra email đầu vào có hợp lệ không.
    const validation = validateSendResetOtpPayload(request.body);

    if (!validation.valid) {
      throw createHttpError(validation.errors[0], 400);
    }

    const { email } = validation.data;
    // Tìm user theo email để gắn OTP reset mật khẩu.
    const user = await User.findOne({ email });

    if (!user) {
      throw createHttpError('Không tìm thấy tài khoản với email này', 404);
    }

    // Tạo OTP, băm OTP và đặt thời hạn hiệu lực 10 phút.
    const otp = generateOtpCode();
    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Lưu OTP đã băm để không lộ mã gốc trong database.
    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpiresAt = otpExpiresAt;
    await user.save();

    try {
      // Gửi OTP thật qua email.
      await sendPasswordResetOtpEmail({ toEmail: email, otp });
    } catch (mailError) {
      // Nếu gửi mail thất bại thì rollback OTP vừa lưu để tránh mã "ma" còn tồn tại.
      user.passwordResetOtpHash = '';
      user.passwordResetOtpExpiresAt = null;
      await user.save();
      throw mailError;
    }

    // Trả về thông tin thời hạn hiệu lực của OTP cho frontend.
    response.json({
      message: 'Đã gửi mã OTP về Gmail của bạn',
      expiresInMinutes: 10,
    });
  } catch (error) {
    // Chuyển lỗi cho middleware xử lý lỗi chung.
    next(error);
  }
}

// Đặt lại mật khẩu bằng email + OTP.
export async function resetPasswordWithOtp(request, response, next) {
  try {
    // Kiểm tra payload gồm email, OTP và mật khẩu mới.
    const validation = validateResetPasswordWithOtpPayload(request.body);

    if (!validation.valid) {
      throw createHttpError(validation.errors[0], 400);
    }

    const { email, otp, newPassword } = validation.data;
    // Tìm user cần đặt lại mật khẩu.
    const user = await User.findOne({ email });

    if (!user) {
      throw createHttpError('Không tìm thấy tài khoản với email này', 404);
    }

    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      // Chưa có OTP nào được gửi trước đó thì không cho reset.
      throw createHttpError('Bạn chưa gửi mã OTP', 400);
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      // OTP quá hạn thì yêu cầu người dùng xin mã mới.
      throw createHttpError('Mã OTP đã hết hạn', 400);
    }

    if (user.passwordResetOtpHash !== hashOtp(otp)) {
      // So sánh OTP người dùng nhập với giá trị hash đang lưu.
      throw createHttpError('Mã OTP không đúng', 400);
    }

    // Nếu OTP đúng thì băm mật khẩu mới và xóa OTP cũ.
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtpHash = '';
    user.passwordResetOtpExpiresAt = null;
    await user.save();

    // Thông báo đặt lại mật khẩu thành công.
    response.json({
      message: 'Đặt lại mật khẩu thành công bằng mã OTP',
    });
  } catch (error) {
    // Đẩy lỗi về middleware xử lý lỗi.
    next(error);
  }
}
