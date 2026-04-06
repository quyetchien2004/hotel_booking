export const BLOG_POSTS = [
  {
    id: '1',
    category: 'Booking',
    readTime: '05 phút đọc',
    title: 'Tối ưu đặt phòng theo giờ cho chuyến đi ngắn',
    subtitle: 'Cách chọn khung giờ, kiểm soát chi phí và tránh các lỗi đặt phòng sát giờ cao điểm.',
    desc: 'Bài viết tập trung vào cách đọc lịch phòng, chọn mốc check-in hợp lý và tận dụng hệ thống tìm phòng theo giờ để không bị phát sinh chi phí không cần thiết.',
    coverImage: '/img/rooms-details/2_nguoi_luxury_ban_cong.png',
    images: [
      '/img/rooms-details/2_nguoi_luxury_ban_cong.png',
      '/img/rooms-details/2_nguoi_luxury.jpg',
      '/img/rooms-details/2_nguoi(2).jpg',
    ],
    stats: [
      { label: 'Khung giờ gợi ý', value: '14:00 - 22:00' },
      { label: 'Mức tiết kiệm', value: '10% - 18%' },
      { label: 'Đối tượng phù hợp', value: 'Công tác ngắn ngày' },
    ],
    highlights: [
      { title: 'Chốt giờ nhận phòng trước', text: 'Đặt sớm từ 2 đến 4 tiếng giúp bạn chọn được phòng đẹp và tránh dồn vào giờ cao điểm.' },
      { title: 'Ưu tiên bộ lọc theo ngân sách', text: 'Nên giới hạn mức giá trước khi chọn loại phòng để kết quả trả về sát nhu cầu hơn.' },
      { title: 'Kiểm tra lại ngày và giờ', text: 'Các booking theo giờ rất dễ bị lệch nếu nhập nhầm AM/PM hoặc chọn sai mốc trả phòng.' },
    ],
    sections: [
      {
        heading: 'Đặt phòng theo giờ hiệu quả bắt đầu từ việc đọc đúng nhu cầu',
        body: 'Nếu chuyến đi của bạn chỉ cần một không gian lưu trú ngắn để nghỉ ngơi, thay đồ hoặc làm việc vài tiếng, chế độ đặt phòng theo giờ sẽ tối ưu hơn rất nhiều so với booking theo ngày. Điểm quan trọng là xác định chính xác khoảng thời gian cần sử dụng, sau đó đối chiếu với lịch di chuyển để tránh đặt dư từ 1 đến 2 giờ không cần thiết.',
      },
      {
        heading: 'Hãy để bộ lọc làm phần việc nặng',
        body: 'Thay vì xem từng phòng một, bạn nên khoanh vùng bằng tỉnh/thành, khoảng giá và loại phòng trước. Sau khi có danh sách rút gọn, hãy ưu tiên các phòng có ảnh thật rõ ràng, thông tin tiện nghi đầy đủ và mức giá được minh bạch ngay từ đầu để tránh phát sinh bất ngờ khi thanh toán.',
      },
      {
        heading: 'Sai một bước nhỏ có thể làm chậm cả luồng booking',
        body: 'Lỗi phổ biến nhất nằm ở việc nhập sai giờ nhận hoặc trả phòng, khiến hệ thống báo phòng không khả dụng hoặc tính tiền cao hơn. Trước khi xác nhận, hãy rà lại mốc thời gian, tên khách lưu trú và phương thức thanh toán. Chỉ một thao tác kiểm tra cuối cũng có thể giúp bạn tiết kiệm khá nhiều thời gian xử lý lại đơn.',
      },
    ],
  },
  {
    id: '2',
    category: 'Thanh toán',
    readTime: '06 phút đọc',
    title: 'Thanh toán cọc 30% hay 100%: nên chọn cách nào?',
    subtitle: 'So sánh hai cách thanh toán phổ biến để cân bằng giữa tính linh hoạt và tốc độ xác nhận phòng.',
    desc: 'Một bài viết dành cho khách thường phân vân giữa việc giữ tiền mặt linh hoạt hay chốt nhanh toàn bộ booking. Nội dung tập trung vào luồng duyệt cọc, tốc độ xác nhận và mức độ phù hợp theo từng tình huống.',
    coverImage: '/img/rooms-details/4_nguoi_luxury.jpg',
    images: [
      '/img/rooms-details/4_nguoi_luxury.jpg',
      '/img/rooms-details/4_nguoi_luxury(2).jpg',
      '/img/rooms-details/4_nguoi_luxury_ban_cong.jpg',
    ],
    stats: [
      { label: 'Thanh toán cọc', value: '30%' },
      { label: 'Thanh toán toàn phần', value: '100%' },
      { label: 'Tốc độ duyệt nhanh', value: 'Ngay tức thì' },
    ],
    highlights: [
      { title: 'Cọc 30% khi cần giữ chỗ linh hoạt', text: 'Phù hợp nếu bạn vẫn đang chờ chốt lịch trình cuối cùng hoặc cần admin xác nhận thêm.' },
      { title: 'Thanh toán 100% khi muốn khóa phòng ngay', text: 'Luồng này giúp booking đi thẳng đến trạng thái hoàn tất nhanh hơn và xuất hóa đơn sớm hơn.' },
      { title: 'Ưu tiên theo mức chắc chắn của kế hoạch', text: 'Nếu lịch đi đã ổn định, thanh toán 100% sẽ giảm bớt số bước xử lý và chờ duyệt.' },
    ],
    sections: [
      {
        heading: 'Đặt cọc 30% không phải lúc nào cũng là lựa chọn an toàn nhất',
        body: 'Rất nhiều khách chọn cọc 30% vì nghĩ sẽ linh hoạt hơn, nhưng điều đó chỉ đúng khi bạn thật sự cần thời gian chờ xác nhận hoặc còn đang thay đổi lịch trình. Với các chuyến đi đã gần như chốt xong, việc đặt cọc đôi khi làm phát sinh thêm bước chờ admin duyệt và kéo dài thời gian trước khi booking đạt trạng thái ổn định.',
      },
      {
        heading: 'Thanh toán 100% phù hợp khi bạn cần tốc độ và sự chắc chắn',
        body: 'Nếu bạn cần khóa phòng ngay, muốn có hóa đơn sớm hoặc cần hoàn tất quy trình trước giờ di chuyển, thanh toán 100% là phương án gọn hơn. Luồng này giúp booking đi thẳng vào trạng thái thành công sau khi cổng thanh toán xác nhận, giảm bớt một lớp chờ trung gian.',
      },
      {
        heading: 'Cách chọn đúng là nhìn vào kế hoạch di chuyển',
        body: 'Khi lịch trình còn mở, hãy chọn cọc. Khi lịch trình đã chắc, hãy ưu tiên thanh toán đủ. Quy tắc này đơn giản nhưng giúp bạn tránh được cả hai cực: vừa mất thời gian vì chờ duyệt, vừa rủi ro phải chỉnh sửa khi kế hoạch chưa rõ ràng.',
      },
    ],
  },
  {
    id: '3',
    category: 'Voucher',
    readTime: '04 phút đọc',
    title: 'Sử dụng voucher đúng cách để giảm chi phí lưu trú',
    subtitle: 'Hiểu đúng ba mốc WELCOME10, FREQUENT25 và LOYAL10 để không bỏ lỡ ưu đãi.',
    desc: 'Bài viết tổng hợp lại logic voucher mới của hệ thống và cách chọn đúng mã theo vòng đời tài khoản, từ user mới đến khách đã xác thực CCCD và hoàn tất nhiều booking.',
    coverImage: '/img/rooms-details/6_nguoi_luxury_ban_cong.jpg',
    images: [
      '/img/rooms-details/6_nguoi_luxury_ban_cong.jpg',
      '/img/rooms-details/6_nguoi_luxury.jpg',
      '/img/rooms-details/6_nguoi.jpg',
    ],
    stats: [
      { label: 'Ưu đãi mở đầu', value: '10%' },
      { label: 'Ưu đãi trust 100', value: '25%' },
      { label: 'Ưu đãi booking lần 2', value: '10%' },
    ],
    highlights: [
      { title: 'WELCOME10 cho tài khoản mới', text: 'Chỉ áp dụng khi tài khoản chưa có booking thành công nào trước đó.' },
      { title: 'FREQUENT25 sau mốc trust 100', text: 'Người dùng phải xác thực CCCD và hoàn tất booking đầu tiên để mở ưu đãi này.' },
      { title: 'LOYAL10 cho lần quay lại', text: 'Sau khi hoàn tất booking thành công lần thứ 2, hệ thống mở thêm voucher 10%.' },
    ],
    sections: [
      {
        heading: 'Voucher hiệu quả nhất khi đi đúng mốc hành vi',
        body: 'Thay vì phát khuyến mãi đại trà, hệ thống voucher của CCT Hotels được gắn theo từng giai đoạn tương tác với tài khoản. Cách làm này giúp ưu đãi rõ ràng, dễ nhớ và cũng tạo cảm giác tiến triển: càng hoàn tất nhiều bước, bạn càng mở được ưu đãi tốt hơn.',
      },
      {
        heading: 'Đừng nhầm giữa trust 80 và trust 100',
        body: 'Xác thực CCCD thành công giúp tài khoản đạt mốc trust cao hơn, nhưng voucher 25% chỉ xuất hiện khi bạn đã bước thêm một nhịp nữa: hoàn tất booking đầu tiên để trust lên 100. Đây là điểm nhiều người thường bỏ sót khi chỉ nhìn vào trạng thái đã verified.',
      },
      {
        heading: 'Booking lần 2 là lúc mở thêm lớp ưu đãi quay lại',
        body: 'LOYAL10 không dành cho booking đầu tiên. Nó là tín hiệu cho thấy hệ thống đang khuyến khích lượt quay lại. Khi bạn đã hoàn tất hai booking thành công, mã giảm 10% này trở thành công cụ rất phù hợp cho các kỳ lưu trú định kỳ hoặc chuyến công tác lặp lại.',
      },
    ],
  },
  {
    id: '4',
    category: 'Kinh nghiệm',
    readTime: '05 phút đọc',
    title: 'Checklist đặt phòng không lỗi cho người mới',
    subtitle: 'Một danh sách ngắn nhưng đủ sâu để bạn chốt booking gọn, rõ và ít phải sửa lại.',
    desc: 'Bài viết được viết như một checklist thao tác: từ chọn phòng, đối chiếu ảnh thực tế, áp voucher đến kiểm tra thanh toán và thông tin người lưu trú trước khi xác nhận.',
    coverImage: '/img/rooms-details/10_nguoi_luxury_ban_cong.jpg',
    images: [
      '/img/rooms-details/10_nguoi_luxury_ban_cong.jpg',
      '/img/rooms-details/10_nguoi_luxury.jpg',
      '/img/rooms-details/CCT_floor.jpg',
    ],
    stats: [
      { label: 'Bước cần rà', value: '05 mục chính' },
      { label: 'Thời gian kiểm tra', value: '02 phút' },
      { label: 'Mức giảm lỗi', value: 'Rõ rệt' },
    ],
    highlights: [
      { title: 'So khớp ảnh và loại phòng', text: 'Luôn xem ảnh thật trước khi bấm đặt để tránh chọn nhầm phong cách hoặc sức chứa.' },
      { title: 'Kiểm tra voucher trước khi thanh toán', text: 'Nhập mã sớm giúp bạn nhìn được tổng tiền cuối cùng trước khi chuyển cổng thanh toán.' },
      { title: 'Rà kỹ thông tin khách lưu trú', text: 'Sai tên, sai ngày hoặc sai phương thức thanh toán là ba lỗi phổ biến nhất của user mới.' },
    ],
    sections: [
      {
        heading: 'Checklist tốt nhất là checklist đủ ngắn để bạn thật sự dùng',
        body: 'Nhiều danh sách hướng dẫn dài và đầy đủ, nhưng khi bước vào lúc cần đặt phòng gấp thì người dùng lại bỏ qua. Vì vậy, checklist hiệu quả nên tập trung vào 5 việc quan trọng nhất: chọn đúng loại phòng, kiểm tra lịch, so khớp ảnh thật, kiểm tra tổng tiền và rà lại thông tin người đặt.',
      },
      {
        heading: 'Ảnh thực tế là lớp xác nhận thứ hai sau thông số',
        body: 'Tên phòng, sức chứa và diện tích chỉ mới là lớp thông tin đầu tiên. Ảnh mới là thứ giúp bạn cảm nhận được cách bài trí, mức sáng, tông nội thất và độ phù hợp với mục đích lưu trú. Với người dùng mới, xem kỹ gallery gần như luôn là bước bắt buộc.',
      },
      {
        heading: 'Một lần rà cuối giúp bạn tránh việc sửa booking',
        body: 'Trước khi bấm thanh toán, hãy đọc lại tổng tiền, phương thức thanh toán, voucher áp dụng và tên khách lưu trú. Đây là bước nhỏ nhưng tiết kiệm rất nhiều công sức hơn so với việc phải hủy, sửa hoặc tạo lại đơn sau đó.',
      },
    ],
  },
];

export function getBlogPostById(id) {
  return BLOG_POSTS.find((post) => post.id === String(id)) || null;
}