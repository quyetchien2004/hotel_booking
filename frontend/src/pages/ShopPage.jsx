import MarketingInfoPage from '../components/MarketingInfoPage';

export default function ShopPage() {
  return (
    <MarketingInfoPage
      activePage="services"
      title="Cửa hàng tiện ích"
      subtitle="Không gian giới thiệu các gói quà tặng và sản phẩm dịch vụ bổ sung."
      intro="Trang shop trong template cũ được rút gọn thành một điểm chạm marketing. Trọng tâm hiện tại vẫn là đặt phòng và trải nghiệm lưu trú, còn sản phẩm bổ sung sẽ được triển khai sau."
      highlights={[
        { title: 'Gift voucher', text: 'Voucher quà tặng cho đối tác và khách thân thiết.' },
        { title: 'Add-on lưu trú', text: 'Các gói dịch vụ ăn sáng, đưa đón và nâng hạng phòng.' },
        { title: 'Triển khai theo giai đoạn', text: 'Nội dung thương mại mở rộng sẽ được bổ sung ở các phiên bản sau.' },
      ]}
      primaryAction={{ to: '/pricing', label: 'Xem ưu đãi hiện tại' }}
      secondaryAction={{ to: '/shop-details', label: 'Chi tiết gói dịch vụ' }}
    />
  );
}
