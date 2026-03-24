import { Navigate, Route, Routes } from 'react-router-dom';
import AboutPage from './pages/AboutPage';
import AdminBookingsPage from './pages/AdminBookingsPage';
import AdminManagePage from './pages/AdminManagePage';
import BlogDetailsPage from './pages/BlogDetailsPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import BookingPage from './pages/BookingPage';
import ChatbotPage from './pages/ChatbotPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import HomePage from './pages/HomePage';
import Index2Page from './pages/Index2Page';
import LoginPage from './pages/LoginPage';
import MyAccountPage from './pages/MyAccountPage';
import MyBookingsPage from './pages/MyBookingsPage';
import NotFoundPage from './pages/NotFoundPage';
import PaymentResultPage from './pages/PaymentResultPage';
import PricingPage from './pages/PricingPage';
import ProjectsPage from './pages/ProjectsPage';
import RegisterPage from './pages/RegisterPage';
import RoomListPage from './pages/RoomListPage';
import ServicesPage from './pages/ServicesPage';
import ShopDetailsPage from './pages/ShopDetailsPage';
import ShopPage from './pages/ShopPage';
import SingleRoomsPage from './pages/SingleRoomsPage';
import SingleServicePage from './pages/SingleServicePage';
import TeamPage from './pages/TeamPage';
import TeamSinglePage from './pages/TeamSinglePage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/index-2" element={<Index2Page />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog-details" element={<BlogDetailsPage />} />
      <Route path="/blog/:id" element={<BlogPostPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/single-rooms" element={<SingleRoomsPage />} />
      <Route path="/single-service" element={<SingleServicePage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/team-single" element={<TeamSinglePage />} />
      <Route path="/room" element={<RoomListPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/shop-details" element={<ShopDetailsPage />} />
      <Route path="/payment-result" element={<PaymentResultPage />} />
      <Route path="/chatbot" element={<ChatbotPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/my-account" element={<MyAccountPage />} />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/admin/bookings" element={<AdminBookingsPage />} />
      <Route path="/admin/manage" element={<AdminManagePage />} />
      <Route path="/admin-bookings" element={<Navigate to="/admin/bookings" replace />} />
      <Route path="/admin-manage" element={<Navigate to="/admin/manage" replace />} />

      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
