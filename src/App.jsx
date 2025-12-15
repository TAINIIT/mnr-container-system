import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ConfigProvider } from './context/ConfigContext';
import { LanguageProvider } from './context/LanguageContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { TabProvider } from './context/TabContext';
import { ChatProvider } from './context/ChatContext';
import { ToastProvider } from './components/common/Toast';
import Login from './pages/Login';
import MainLayout from './components/Layout/MainLayout';
import Workspace from './pages/Workspace';
import Dashboard from './pages/Dashboard';
import ContainerList from './pages/Container/ContainerList';
import ContainerDetail from './pages/Container/ContainerDetail';
import ContainerRegistration from './pages/Container/ContainerRegistration';
import ARList from './pages/Container/ARList';
import SurveyList from './pages/Survey/SurveyList';
import SurveyForm from './pages/Survey/SurveyForm';
import ContainerSearch from './pages/Survey/ContainerSearch';
import EORList from './pages/EOR/EORList';
import EORForm from './pages/EOR/EORForm';
import EORDetail from './pages/EOR/EORDetail';
import RepairOrderList from './pages/RepairOrder/RepairOrderList';
import RepairOrderDetail from './pages/RepairOrder/RepairOrderDetail';
import ShuntingList from './pages/Shunting/ShuntingList';
import PreInspectionList from './pages/PreInspection/PreInspectionList';
import StackingList from './pages/Stacking/StackingList';
import MasterCodes from './pages/Admin/MasterCodes';
import PermissionGroups from './pages/Admin/PermissionGroups';
import UserManagement from './pages/Admin/UserManagement';
import SystemSettings from './pages/Admin/SystemSettings';
import HomePageManagement from './pages/Admin/HomePageManagement';
import ChatManagement from './pages/Admin/ChatManagement';
import JobMonitoring from './pages/Monitoring/JobMonitoring';
import WashingList from './pages/Washing/WashingList';
import WashingForm from './pages/Washing/WashingForm';
import WashingWorkOrder from './pages/Washing/WashingWorkOrder';
import WashingQC from './pages/Washing/WashingQC';
import WashingCertificate from './pages/Washing/WashingCertificate';


// Protected Route wrapper
function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh'
            }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route
                path="/login"
                element={<Login />}
            />

            <Route path="/" element={
                <ProtectedRoute>
                    <TabProvider>
                        <MainLayout />
                    </TabProvider>
                </ProtectedRoute>
            }>
                <Route index element={<Workspace />} />
                <Route path="dashboard" element={<Dashboard />} />

                {/* Container Routes */}
                <Route path="containers" element={<ContainerList />} />
                <Route path="containers/register" element={<ContainerRegistration />} />
                <Route path="containers/:id" element={<ContainerDetail />} />
                <Route path="containers/ar" element={<ARList />} />

                {/* Survey Routes */}
                <Route path="surveys" element={<SurveyList />} />
                <Route path="surveys/search" element={<ContainerSearch />} />
                <Route path="surveys/new/:containerId" element={<SurveyForm />} />
                <Route path="surveys/:id" element={<SurveyForm />} />

                {/* EOR Routes */}
                <Route path="eor" element={<EORList />} />
                <Route path="eor/new" element={<EORForm />} />
                <Route path="eor/new/:surveyId" element={<EORForm />} />
                <Route path="eor/:id" element={<EORDetail />} />
                <Route path="eor/:id/edit" element={<EORForm />} />

                {/* Repair Order Routes */}
                <Route path="repair-orders" element={<RepairOrderList />} />
                <Route path="repair-orders/:id" element={<RepairOrderDetail />} />

                {/* Shunting Routes */}
                <Route path="shunting" element={<ShuntingList />} />

                {/* Pre-Inspection Routes */}
                <Route path="pre-inspection" element={<PreInspectionList />} />

                {/* Washing Station Routes */}
                <Route path="washing" element={<WashingList />} />
                <Route path="washing/new" element={<WashingForm />} />
                <Route path="washing/work/:id" element={<WashingWorkOrder />} />
                <Route path="washing/qc/:id" element={<WashingQC />} />
                <Route path="washing/certificate/:id" element={<WashingCertificate />} />

                {/* Stacking & Release Routes */}
                <Route path="stacking" element={<StackingList />} />

                {/* Monitoring Routes */}
                <Route path="monitoring/jobs" element={<JobMonitoring />} />

                {/* Admin Routes */}
                <Route path="admin/codes" element={<MasterCodes />} />
                <Route path="admin/groups" element={<PermissionGroups />} />
                <Route path="admin/users" element={<UserManagement />} />
                <Route path="admin/settings" element={<SystemSettings />} />
                <Route path="admin/homepage" element={<HomePageManagement />} />
                <Route path="admin/chats" element={<ChatManagement />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <ConfigProvider>
            <AuthProvider>
                <LanguageProvider>
                    <DataProvider>
                        <WorkflowProvider>
                            <ToastProvider>
                                <ChatProvider>
                                    <AppRoutes />
                                </ChatProvider>
                            </ToastProvider>
                        </WorkflowProvider>
                    </DataProvider>
                </LanguageProvider>
            </AuthProvider>
        </ConfigProvider>
    );
}

export default App;
