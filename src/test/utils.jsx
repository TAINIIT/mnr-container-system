/* eslint-disable react/prop-types */
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from '../context/ConfigContext';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ToastProvider } from '../components/common/Toast';
import { WorkflowProvider } from '../context/WorkflowContext';
import { TabProvider } from '../context/TabContext';

export const renderWithProviders = (ui, { route = '/' } = {}) => {
    window.history.pushState({}, 'Test page', route);

    return render(
        <BrowserRouter>
            <LanguageProvider>
                <ConfigProvider>
                    <ToastProvider>
                        <AuthProvider>
                            <DataProvider>
                                <TabProvider>
                                    <WorkflowProvider>
                                        {ui}
                                    </WorkflowProvider>
                                </TabProvider>
                            </DataProvider>
                        </AuthProvider>
                    </ToastProvider>
                </ConfigProvider>
            </LanguageProvider>
        </BrowserRouter>
    );
};
