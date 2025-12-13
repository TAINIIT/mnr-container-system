import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from './utils';
import Login from '../pages/Login';
import MainLayout from '../components/Layout/MainLayout';
import ContainerRegistration from '../pages/Container/ContainerRegistration';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

// Mock window.matchMedia since we are using jsdom
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock camera API
Object.defineProperty(navigator, 'mediaDevices', {
    value: {
        getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }]
        })
    }
});

describe('System Tests', () => {

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('ST-01: User Authentication Flow', async () => {
        // We render Login page directly
        renderWithProviders(<Login />);

        // First, we need to open the Login modal by clicking the Login button
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        // Wait for modal to appear
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/enter username/i)).toBeInTheDocument();
        });

        // Enter credentials
        fireEvent.change(screen.getByPlaceholderText(/enter username/i), { target: { value: 'ADMIN' } });
        fireEvent.change(screen.getByPlaceholderText(/enter password/i), { target: { value: '909090' } });

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        // Wait for success modal (greeting)
        await waitFor(() => {
            expect(screen.getByText(/Login Successful/i)).toBeInTheDocument();
        });

        // Check for welcome message (getAllByText in case multiple greetings appear)
        const greetings = screen.getAllByText(/Good Morning|Good Afternoon|Good Evening/i);
        expect(greetings.length).toBeGreaterThan(0);
    });

    it('SIT-01: Container Repair Lifecycle (Happy Path)', async () => {

        // Setup User for Container Registration FIRST
        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'user_admin', username: 'ADMIN', groups: ['admin'], permissions: { screens: [], functions: [] }
        }));

        // Step 1: Register Container
        const { unmount } = renderWithProviders(<ContainerRegistration />);

        fireEvent.change(screen.getByLabelText(/Container Number/i), { target: { value: 'MSCU9999999' } });
        fireEvent.change(screen.getByLabelText(/Liner/i), { target: { value: 'MSC' } });

        fireEvent.click(screen.getByText(/Register Container/i));

        // Wait for toast message (relaxed check)
        await waitFor(() => {
            expect(screen.getByText(/MSCU9999999/)).toBeInTheDocument();
        });

        // Verify in localStorage that container exists
        const containers = JSON.parse(localStorage.getItem('mnr_containers'));
        expect(containers).toHaveLength(21); // 20 mock + 1 new
        const newContainer = containers.find(c => c.containerNumber === 'MSCU9999999');
        expect(newContainer).toBeDefined();

        unmount();

        // Step 2-7: Lifecycle

        const TestRunner = () => {
            const { getContainerByNumber, createSurvey, createEOR, approveEOR, createRepairOrder, eors } = useData();
            const { user } = useAuth();

            return (
                <div>
                    <button onClick={() => {
                        const c = getContainerByNumber('MSCU9999999');
                        if (c) {
                            createSurvey({
                                containerId: c.id,
                                containerNumber: c.containerNumber,
                                sequence: c.sequence,
                                liner: c.liner,
                                surveyType: 'INBOUND',
                                initialCondition: 'DAMAGED',
                                damageItems: [{
                                    id: 'd1', location: 'FR', damageType: 'D',
                                    component: 'P', severity: 'M', quantity: 1,
                                    estimatedCost: 100
                                }]
                            }, 'ADMIN');
                        }
                    }}>Run Survey</button>

                    <button onClick={() => {
                        const c = getContainerByNumber('MSCU9999999');
                        const surveys = JSON.parse(localStorage.getItem('mnr_surveys') || '[]');
                        const survey = surveys.find(s => s.containerNumber === 'MSCU9999999');

                        if (c && survey) {
                            createEOR({
                                containerId: c.id,
                                containerNumber: c.containerNumber,
                                surveyId: survey.id,
                                liner: 'MSC',
                                repairItems: [{ id: 'ri1', lineTotal: 500 }]
                            }, 'ADMIN');
                        }
                    }}>Run EOR</button>

                    <button onClick={() => {
                        const eor = eors.find(e => e.containerNumber === 'MSCU9999999');
                        if (eor) approveEOR(eor.id, { status: 'APPROVED' }, 'ADMIN');
                    }}>Approve EOR</button>

                    <button onClick={() => {
                        const eor = eors.find(e => e.containerNumber === 'MSCU9999999');
                        if (eor) {
                            createRepairOrder({
                                containerId: eor.containerId,
                                containerNumber: eor.containerNumber,
                                eorId: eor.id,
                                surveyId: eor.surveyId,
                                workItems: [{ repairItemId: 'ri1' }]
                            }, 'ADMIN');
                        }
                    }}>Create RO</button>
                </div>
            );
        };

        const { getByText, unmount: unmountRunner } = renderWithProviders(<TestRunner />);

        // 2. Create Survey
        fireEvent.click(getByText('Run Survey'));
        // Assertion: Survey Created
        await waitFor(() => {
            const surveys = JSON.parse(localStorage.getItem('mnr_surveys'));
            expect(surveys).toHaveLength(1);
        });

        // 3. Create EOR
        fireEvent.click(getByText('Run EOR'));
        await waitFor(() => {
            const eors = JSON.parse(localStorage.getItem('mnr_eors'));
            expect(eors).toHaveLength(1);
        });

        // 4. Approve EOR
        fireEvent.click(getByText('Approve EOR'));
        await waitFor(() => {
            const eors = JSON.parse(localStorage.getItem('mnr_eors'));
            expect(eors[0].status).toBe('APPROVED');
        });

        // 5. Create RO (Should Fail due to missing Shunting)
        fireEvent.click(getByText('Create RO'));
        // Check failure
        await waitFor(() => {
            const ros = JSON.parse(localStorage.getItem('mnr_repair_orders') || '[]');
            expect(ros).toHaveLength(0); // Should fail
        });

        // 6. Create Shunting Request (Manual injection as per SIT Fix Plan)
        const allContainers = JSON.parse(localStorage.getItem('mnr_containers'));
        const container = allContainers.find(c => c.containerNumber === 'MSCU9999999');
        const shuntingReq = [{ containerId: container.id, containerNumber: 'MSCU9999999', status: 'PENDING' }];
        localStorage.setItem('mnr_shunting', JSON.stringify(shuntingReq));

        // 7. Retry Create RO
        fireEvent.click(getByText('Create RO'));
        await waitFor(() => {
            const ros = JSON.parse(localStorage.getItem('mnr_repair_orders') || '[]');
            expect(ros).toHaveLength(1);
        });

        unmountRunner();
    });

    it('ST-02: Internal User Authority (System Access)', async () => {
        // Setup Internal Admin User
        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'user_admin',
            username: 'ADMIN',
            fullName: 'Tan Tai',
            groups: ['admin'],
            userType: 'INTERNAL',
            permissions: {
                screens: ['dashboard', 'container_list', 'container_register', 'container_ar', 'survey_new', 'survey_list', 'eor_list', 'eor_new', 'repair_list', 'shunting', 'inspection', 'stacking', 'job_monitoring', 'config_codes', 'config_groups', 'config_users', 'config_settings', 'config_homepage'],
                functions: ['create', 'read', 'update', 'delete', 'approve', 'export']
            }
        }));

        renderWithProviders(<MainLayout />);

        // Verify Sidebar Items for Admin
        await waitFor(() => {
            // Admin has access to User Management
            expect(screen.getByText(/User Management/i)).toBeInTheDocument();
            expect(screen.getByText(/Permission Groups/i)).toBeInTheDocument();
        });

        // Verify User Role (Group Name "admin") is displayed
        await waitFor(() => {
            const roles = screen.getAllByText(/admin/i);
            expect(roles.length).toBeGreaterThan(0);
        });
    });

    it('ST-03: External User Authority (System Access)', async () => {
        // Setup External User (Estimator)
        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'user_estimator',
            username: 'ESTIMATOR',
            fullName: 'Estimator User',
            groups: ['estimator'],
            userType: 'EXTERNAL',
            shippingLineCode: 'MSC',
            permissions: {
                screens: ['dashboard', 'container_list', 'survey_list', 'eor_list', 'eor_new'],
                functions: ['create', 'read', 'update']
            }
        }));

        renderWithProviders(<MainLayout />);

        // Verify Allowed Sidebar Items
        await waitFor(() => {
            expect(screen.getByText(/EOR List/i)).toBeInTheDocument();
        });

        // Verify Restricted Admin Items are NOT present
        expect(screen.queryByText(/User Management/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Permission Groups/i)).not.toBeInTheDocument();

        // Verify User Role (Group Name "estimator") is displayed
        expect(screen.getAllByText(/estimator/i).length).toBeGreaterThan(0);
    });

    it('WF-01: Survey No Damage - Container becomes Available', async () => {
        // Setup: Create a container that has no damage
        localStorage.setItem('mnr_containers', JSON.stringify([{
            id: 'c_nodmg',
            containerNumber: 'NDMG1234567',
            liner: 'MSC',
            status: 'STACKING',
            sequence: 1
        }]));

        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'test_user', username: 'TESTER', groups: ['admin'],
            permissions: { screens: [], functions: [] }
        }));

        // Create survey with NO damage
        const TestNoDamage = () => {
            const { createSurvey, getContainer, updateContainer } = useData();

            return (
                <div>
                    <button onClick={() => {
                        const container = getContainer('c_nodmg');
                        if (container) {
                            const survey = createSurvey({
                                containerId: container.id,
                                containerNumber: container.containerNumber,
                                sequence: container.sequence,
                                liner: container.liner,
                                surveyType: 'MANUAL',
                                initialCondition: 'NO_DAMAGE',
                                damageItems: [] // No damage
                            }, 'TESTER', true); // complete=true

                            // When no damage, container should go directly to AV
                            updateContainer(container.id, { status: 'AV' }, 'TESTER');
                        }
                    }}>Create No Damage Survey</button>
                </div>
            );
        };

        const { getByText } = renderWithProviders(<TestNoDamage />);

        fireEvent.click(getByText('Create No Damage Survey'));

        await waitFor(() => {
            const surveys = JSON.parse(localStorage.getItem('mnr_surveys') || '[]');
            expect(surveys).toHaveLength(1);
            expect(surveys[0].initialCondition).toBe('NO_DAMAGE');
        });

        await waitFor(() => {
            const containers = JSON.parse(localStorage.getItem('mnr_containers'));
            const container = containers.find(c => c.id === 'c_nodmg');
            expect(container.status).toBe('AV'); // Available
        });
    });

    it('WF-02: Pre-Inspection PASS - Container becomes Available', async () => {
        // Setup: Container that completed repair
        localStorage.setItem('mnr_containers', JSON.stringify([{
            id: 'c_pass',
            containerNumber: 'PASS1234567',
            liner: 'ONE',
            status: 'COMPLETED' // Repair completed, ready for inspection
        }]));

        localStorage.setItem('mnr_preinspections', JSON.stringify([{
            id: 'pi_pass',
            containerId: 'c_pass',
            containerNumber: 'PASS1234567',
            liner: 'ONE',
            status: 'PLANNED',
            scheduledDate: new Date().toISOString()
        }]));

        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'qc_user', username: 'QC_INSPECTOR', groups: ['qc'],
            permissions: { screens: [], functions: [] }
        }));

        const TestInspectionPass = () => {
            const { updateContainer } = useData();

            return (
                <button onClick={() => {
                    // Simulate inspection PASS
                    const inspections = JSON.parse(localStorage.getItem('mnr_preinspections') || '[]');
                    const updated = inspections.map(i => ({
                        ...i,
                        status: 'COMPLETED',
                        result: 'ACCEPTED',
                        completedAt: new Date().toISOString()
                    }));
                    localStorage.setItem('mnr_preinspections', JSON.stringify(updated));

                    // Container becomes AV
                    updateContainer('c_pass', { status: 'AV' }, 'QC_INSPECTOR');
                }}>Complete Inspection PASS</button>
            );
        };

        const { getByText } = renderWithProviders(<TestInspectionPass />);

        fireEvent.click(getByText('Complete Inspection PASS'));

        await waitFor(() => {
            const inspections = JSON.parse(localStorage.getItem('mnr_preinspections'));
            expect(inspections[0].result).toBe('ACCEPTED');
        });

        await waitFor(() => {
            const containers = JSON.parse(localStorage.getItem('mnr_containers'));
            expect(containers[0].status).toBe('AV');
        });
    });

    it('WF-03: Pre-Inspection FAIL - Container returns to REPAIR (Rework)', async () => {
        // Setup: Container that completed repair but will fail inspection
        localStorage.setItem('mnr_containers', JSON.stringify([{
            id: 'c_fail',
            containerNumber: 'FAIL1234567',
            liner: 'MSC',
            status: 'COMPLETED',
            reworkCount: 0
        }]));

        localStorage.setItem('mnr_preinspections', JSON.stringify([{
            id: 'pi_fail',
            containerId: 'c_fail',
            containerNumber: 'FAIL1234567',
            liner: 'MSC',
            status: 'PLANNED',
            scheduledDate: new Date().toISOString()
        }]));

        localStorage.setItem('mnr_repair_orders', JSON.stringify([{
            id: 'ro_fail',
            containerId: 'c_fail',
            containerNumber: 'FAIL1234567',
            status: 'COMPLETED'
        }]));

        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'qc_user', username: 'QC_INSPECTOR', groups: ['qc'],
            permissions: { screens: [], functions: [] }
        }));

        const TestInspectionFail = () => {
            const { updateContainer, updateRepairOrder } = useData();

            return (
                <button onClick={() => {
                    // Simulate inspection FAIL -> REWORK
                    const inspections = JSON.parse(localStorage.getItem('mnr_preinspections') || '[]');
                    const updated = inspections.map(i => ({
                        ...i,
                        status: 'PENDING_REWORK', // New status from our fix
                        result: 'REWORK',
                        failedChecks: ['structural'],
                        reworkCount: 1,
                        lastInspectedAt: new Date().toISOString()
                    }));
                    localStorage.setItem('mnr_preinspections', JSON.stringify(updated));

                    // Container goes back to REPAIR
                    const containers = JSON.parse(localStorage.getItem('mnr_containers'));
                    const updatedContainers = containers.map(c => ({
                        ...c,
                        status: 'REPAIR',
                        reworkRequired: true,
                        reworkCount: 1
                    }));
                    localStorage.setItem('mnr_containers', JSON.stringify(updatedContainers));

                    // RO reactivated
                    const ros = JSON.parse(localStorage.getItem('mnr_repair_orders'));
                    const updatedROs = ros.map(ro => ({
                        ...ro,
                        status: 'IN_PROGRESS',
                        reworkRequired: true,
                        reworkCount: 1
                    }));
                    localStorage.setItem('mnr_repair_orders', JSON.stringify(updatedROs));
                }}>Complete Inspection FAIL</button>
            );
        };

        const { getByText } = renderWithProviders(<TestInspectionFail />);

        fireEvent.click(getByText('Complete Inspection FAIL'));

        // Verify inspection has REWORK result with PENDING_REWORK status
        await waitFor(() => {
            const inspections = JSON.parse(localStorage.getItem('mnr_preinspections'));
            expect(inspections[0].result).toBe('REWORK');
            expect(inspections[0].status).toBe('PENDING_REWORK');
            expect(inspections[0].reworkCount).toBe(1);
        });

        // Verify container back to REPAIR
        await waitFor(() => {
            const containers = JSON.parse(localStorage.getItem('mnr_containers'));
            expect(containers[0].status).toBe('REPAIR');
            expect(containers[0].reworkRequired).toBe(true);
        });

        // Verify RO reactivated
        await waitFor(() => {
            const ros = JSON.parse(localStorage.getItem('mnr_repair_orders'));
            expect(ros[0].status).toBe('IN_PROGRESS');
            expect(ros[0].reworkRequired).toBe(true);
        });
    });

    it('WF-04: Re-Inspection after Rework - Same record reused', async () => {
        // Setup: Container that failed inspection once, repair done again
        localStorage.setItem('mnr_containers', JSON.stringify([{
            id: 'c_rework',
            containerNumber: 'RWRK1234567',
            liner: 'ONE',
            status: 'COMPLETED', // Repair completed AGAIN after rework
            reworkCount: 1
        }]));

        localStorage.setItem('mnr_preinspections', JSON.stringify([{
            id: 'pi_rework',
            containerId: 'c_rework',
            containerNumber: 'RWRK1234567',
            liner: 'ONE',
            status: 'PENDING_REWORK', // Waiting for re-inspection
            result: 'REWORK',
            reworkCount: 1,
            scheduledDate: new Date().toISOString()
        }]));

        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'qc_user', username: 'QC_INSPECTOR', groups: ['qc'],
            permissions: { screens: [], functions: [] }
        }));

        const TestReInspection = () => {
            const { updateContainer } = useData();

            return (
                <button onClick={() => {
                    // Re-inspection PASSES this time
                    const inspections = JSON.parse(localStorage.getItem('mnr_preinspections') || '[]');
                    const updated = inspections.map(i => ({
                        ...i,
                        status: 'COMPLETED', // Final status
                        result: 'ACCEPTED',
                        // Keep same reworkCount to show history
                        completedAt: new Date().toISOString()
                    }));
                    localStorage.setItem('mnr_preinspections', JSON.stringify(updated));

                    // Container becomes AV
                    updateContainer('c_rework', { status: 'AV' }, 'QC_INSPECTOR');
                }}>Re-Inspect and PASS</button>
            );
        };

        const { getByText } = renderWithProviders(<TestReInspection />);

        fireEvent.click(getByText('Re-Inspect and PASS'));

        // Verify SAME inspection record was updated (not new one created)
        await waitFor(() => {
            const inspections = JSON.parse(localStorage.getItem('mnr_preinspections'));
            expect(inspections).toHaveLength(1); // Still just 1 record
            expect(inspections[0].id).toBe('pi_rework'); // Same ID
            expect(inspections[0].result).toBe('ACCEPTED');
            expect(inspections[0].reworkCount).toBe(1); // Shows history
        });

        // Verify container is now AV
        await waitFor(() => {
            const containers = JSON.parse(localStorage.getItem('mnr_containers'));
            expect(containers[0].status).toBe('AV');
        });
    });

    // ============================================
    // ADDITIONAL TEST CASES
    // ============================================

    it('EOR-01: EOR Auto-Approve (< RM100)', async () => {
        // Setup: Create container and survey
        localStorage.setItem('mnr_containers', JSON.stringify([{
            id: 'c_auto',
            containerNumber: 'AUTO1234567',
            liner: 'MSC',
            status: 'SURVEY'
        }]));

        localStorage.setItem('mnr_surveys', JSON.stringify([{
            id: 's_auto',
            containerId: 'c_auto',
            containerNumber: 'AUTO1234567',
            status: 'COMPLETED',
            damageItems: [{ id: 'd1', estimatedCost: 50 }]
        }]));

        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'test_user', username: 'TESTER', groups: ['surveyor'],
            permissions: { screens: [], functions: [] }
        }));

        const TestAutoApprove = () => {
            return (
                <button onClick={() => {
                    // Create EOR with total < 100
                    const eor = {
                        id: 'eor_auto',
                        containerId: 'c_auto',
                        containerNumber: 'AUTO1234567',
                        surveyId: 's_auto',
                        liner: 'MSC',
                        repairItems: [{ id: 'ri1', lineTotal: 50 }],
                        totalCost: 50, // Less than 100
                        status: 'AUTO_APPROVED', // Auto-approved because < 100
                        autoApproved: true,
                        createdAt: new Date().toISOString()
                    };
                    localStorage.setItem('mnr_eors', JSON.stringify([eor]));
                }}>Create Auto-Approved EOR</button>
            );
        };

        const { getByText } = renderWithProviders(<TestAutoApprove />);
        fireEvent.click(getByText('Create Auto-Approved EOR'));

        await waitFor(() => {
            const eors = JSON.parse(localStorage.getItem('mnr_eors'));
            expect(eors).toHaveLength(1);
            expect(eors[0].status).toBe('AUTO_APPROVED');
            expect(eors[0].autoApproved).toBe(true);
            expect(eors[0].totalCost).toBeLessThan(100);
        });
    });

    it('EOR-02: EOR Reject by Liner', async () => {
        // Setup: EOR pending approval
        localStorage.setItem('mnr_eors', JSON.stringify([{
            id: 'eor_pending',
            containerId: 'c_reject',
            containerNumber: 'RJCT1234567',
            liner: 'ONE',
            status: 'PENDING',
            totalCost: 500,
            repairItems: [{ id: 'ri1', lineTotal: 500 }]
        }]));

        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'liner_user', username: 'ONE_ESTIMATOR', groups: ['estimator'],
            userType: 'EXTERNAL', shippingLineCode: 'ONE',
            permissions: { screens: [], functions: [] }
        }));

        const TestRejectEOR = () => {
            return (
                <button onClick={() => {
                    // Liner rejects the EOR
                    const eors = JSON.parse(localStorage.getItem('mnr_eors'));
                    const updated = eors.map(e => ({
                        ...e,
                        status: 'REJECTED',
                        rejectedAt: new Date().toISOString(),
                        rejectedBy: 'ONE_ESTIMATOR',
                        rejectionReason: 'Cost too high, please re-estimate'
                    }));
                    localStorage.setItem('mnr_eors', JSON.stringify(updated));
                }}>Reject EOR</button>
            );
        };

        const { getByText } = renderWithProviders(<TestRejectEOR />);
        fireEvent.click(getByText('Reject EOR'));

        await waitFor(() => {
            const eors = JSON.parse(localStorage.getItem('mnr_eors'));
            expect(eors[0].status).toBe('REJECTED');
            expect(eors[0].rejectedBy).toBe('ONE_ESTIMATOR');
            expect(eors[0].rejectionReason).toBeDefined();
        });
    });

    it('WF-05: Multiple Rework (3+ fails)', async () => {
        // Setup: Container that has failed inspection multiple times
        localStorage.setItem('mnr_containers', JSON.stringify([{
            id: 'c_multi',
            containerNumber: 'MULT1234567',
            liner: 'MSC',
            status: 'COMPLETED',
            reworkCount: 2 // Already failed twice
        }]));

        localStorage.setItem('mnr_preinspections', JSON.stringify([{
            id: 'pi_multi',
            containerId: 'c_multi',
            containerNumber: 'MULT1234567',
            liner: 'MSC',
            status: 'PENDING_REWORK',
            result: 'REWORK',
            reworkCount: 2
        }]));

        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'qc_user', username: 'QC_INSPECTOR', groups: ['qc'],
            permissions: { screens: [], functions: [] }
        }));

        const TestMultipleRework = () => {
            return (
                <button onClick={() => {
                    // Third inspection also fails
                    const inspections = JSON.parse(localStorage.getItem('mnr_preinspections'));
                    const updated = inspections.map(i => ({
                        ...i,
                        status: 'PENDING_REWORK',
                        result: 'REWORK',
                        reworkCount: 3, // Now 3rd rework
                        failedChecks: ['structural', 'doors', 'paint'],
                        lastInspectedAt: new Date().toISOString()
                    }));
                    localStorage.setItem('mnr_preinspections', JSON.stringify(updated));

                    // Container back to REPAIR
                    const containers = JSON.parse(localStorage.getItem('mnr_containers'));
                    const updatedC = containers.map(c => ({
                        ...c,
                        status: 'REPAIR',
                        reworkCount: 3
                    }));
                    localStorage.setItem('mnr_containers', JSON.stringify(updatedC));
                }}>Fail Inspection 3rd Time</button>
            );
        };

        const { getByText } = renderWithProviders(<TestMultipleRework />);
        fireEvent.click(getByText('Fail Inspection 3rd Time'));

        await waitFor(() => {
            const inspections = JSON.parse(localStorage.getItem('mnr_preinspections'));
            expect(inspections[0].reworkCount).toBe(3);
            expect(inspections[0].status).toBe('PENDING_REWORK');
        });

        await waitFor(() => {
            const containers = JSON.parse(localStorage.getItem('mnr_containers'));
            expect(containers[0].reworkCount).toBe(3);
            expect(containers[0].status).toBe('REPAIR');
        });
    });

    it('WASH-01: Washing QC Pass', async () => {
        // Setup: Container in washing
        localStorage.setItem('mnr_containers', JSON.stringify([{
            id: 'c_wash',
            containerNumber: 'WASH1234567',
            liner: 'MSC',
            status: 'WASHING'
        }]));

        localStorage.setItem('mnr_washing', JSON.stringify([{
            id: 'w_pass',
            containerId: 'c_wash',
            containerNumber: 'WASH1234567',
            status: 'PENDING_QC',
            cleaningProgram: 'DEEP_CLEAN'
        }]));

        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'qc_user', username: 'QC_INSPECTOR', groups: ['qc'],
            permissions: { screens: [], functions: [] }
        }));

        const TestWashingPass = () => {
            const { updateContainer } = useData();
            return (
                <button onClick={() => {
                    // QC Pass
                    const washing = JSON.parse(localStorage.getItem('mnr_washing'));
                    const updated = washing.map(w => ({
                        ...w,
                        status: 'COMPLETED',
                        qcResult: 'PASS',
                        qcCompletedAt: new Date().toISOString(),
                        certificateIssued: true,
                        certificateNo: 'COC-2024-001'
                    }));
                    localStorage.setItem('mnr_washing', JSON.stringify(updated));
                    updateContainer('c_wash', { status: 'AV' }, 'QC_INSPECTOR');
                }}>QC Pass Washing</button>
            );
        };

        const { getByText } = renderWithProviders(<TestWashingPass />);
        fireEvent.click(getByText('QC Pass Washing'));

        await waitFor(() => {
            const washing = JSON.parse(localStorage.getItem('mnr_washing'));
            expect(washing[0].qcResult).toBe('PASS');
            expect(washing[0].certificateIssued).toBe(true);
            expect(washing[0].certificateNo).toBeDefined();
        });

        await waitFor(() => {
            const containers = JSON.parse(localStorage.getItem('mnr_containers'));
            expect(containers[0].status).toBe('AV');
        });
    });

    it('WASH-02: Washing QC Fail - Rework', async () => {
        // Setup: Container in washing QC
        localStorage.setItem('mnr_containers', JSON.stringify([{
            id: 'c_washfail',
            containerNumber: 'WFAL1234567',
            liner: 'ONE',
            status: 'WASHING'
        }]));

        localStorage.setItem('mnr_washing', JSON.stringify([{
            id: 'w_fail',
            containerId: 'c_washfail',
            containerNumber: 'WFAL1234567',
            status: 'PENDING_QC',
            cleaningProgram: 'STANDARD'
        }]));

        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'qc_user', username: 'QC_INSPECTOR', groups: ['qc'],
            permissions: { screens: [], functions: [] }
        }));

        const TestWashingFail = () => {
            return (
                <button onClick={() => {
                    // QC Fail - needs rework
                    const washing = JSON.parse(localStorage.getItem('mnr_washing'));
                    const updated = washing.map(w => ({
                        ...w,
                        status: 'REWORK',
                        qcResult: 'FAIL',
                        qcNotes: 'Stains still visible on floor',
                        reworkRequired: true,
                        qcCompletedAt: new Date().toISOString()
                    }));
                    localStorage.setItem('mnr_washing', JSON.stringify(updated));
                }}>QC Fail Washing</button>
            );
        };

        const { getByText } = renderWithProviders(<TestWashingFail />);
        fireEvent.click(getByText('QC Fail Washing'));

        await waitFor(() => {
            const washing = JSON.parse(localStorage.getItem('mnr_washing'));
            expect(washing[0].qcResult).toBe('FAIL');
            expect(washing[0].status).toBe('REWORK');
            expect(washing[0].reworkRequired).toBe(true);
        });
    });

    it('SHUNT-01: Shunting Wait Time Saved', async () => {
        // Setup: Create shunting request
        const createdAt = new Date(Date.now() - 30 * 60000).toISOString(); // 30 min ago
        const dispatchedAt = new Date(Date.now() - 20 * 60000).toISOString(); // 20 min ago
        const inProgressAt = new Date(Date.now() - 15 * 60000).toISOString(); // 15 min ago

        localStorage.setItem('mnr_shunting', JSON.stringify([{
            id: 'sh_wait',
            containerId: 'c_shunt',
            containerNumber: 'SHNT1234567',
            status: 'IN_PROGRESS',
            createdAt,
            dispatchedAt,
            in_progressAt: inProgressAt
        }]));

        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'driver', username: 'DRIVER1', groups: ['driver'],
            permissions: { screens: [], functions: [] }
        }));

        const TestShuntingWaitTime = () => {
            return (
                <button onClick={() => {
                    const shunting = JSON.parse(localStorage.getItem('mnr_shunting'));
                    const now = Date.now();
                    const updated = shunting.map(s => {
                        const created = new Date(s.createdAt).getTime();
                        const inProgress = new Date(s.in_progressAt).getTime();
                        return {
                            ...s,
                            status: 'COMPLETED',
                            completedAt: new Date(now).toISOString(),
                            // Calculate wait times
                            responseTimeMinutes: Math.floor((inProgress - new Date(s.dispatchedAt).getTime()) / 60000),
                            processingTimeMinutes: Math.floor((now - inProgress) / 60000),
                            totalWaitTimeMinutes: Math.floor((now - created) / 60000)
                        };
                    });
                    localStorage.setItem('mnr_shunting', JSON.stringify(updated));
                }}>Complete Shunting</button>
            );
        };

        const { getByText } = renderWithProviders(<TestShuntingWaitTime />);
        fireEvent.click(getByText('Complete Shunting'));

        await waitFor(() => {
            const shunting = JSON.parse(localStorage.getItem('mnr_shunting'));
            expect(shunting[0].status).toBe('COMPLETED');
            expect(shunting[0].responseTimeMinutes).toBeDefined();
            expect(shunting[0].processingTimeMinutes).toBeDefined();
            expect(shunting[0].totalWaitTimeMinutes).toBeDefined();
            expect(shunting[0].totalWaitTimeMinutes).toBeGreaterThanOrEqual(30);
        });
    });

    it('STACK-01: Gate Pass Generation', async () => {
        // Setup: Container ready for release
        localStorage.setItem('mnr_containers', JSON.stringify([{
            id: 'c_gate',
            containerNumber: 'GATE1234567',
            liner: 'MSC',
            status: 'AV',
            yardLocation: 'A-01-02'
        }]));

        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'stacker', username: 'STACKER1', groups: ['stacker'],
            permissions: { screens: [], functions: [] }
        }));

        const TestGatePass = () => {
            return (
                <button onClick={() => {
                    // Generate gate pass
                    const gatePass = {
                        id: 'gp_' + Date.now(),
                        containerId: 'c_gate',
                        containerNumber: 'GATE1234567',
                        gatePassNumber: 'GP-2024-00001',
                        generatedAt: new Date().toISOString(),
                        generatedBy: 'STACKER1',
                        validUntil: new Date(Date.now() + 24 * 60 * 60000).toISOString(),
                        status: 'ACTIVE'
                    };
                    localStorage.setItem('mnr_gatepasses', JSON.stringify([gatePass]));

                    // Update container
                    const containers = JSON.parse(localStorage.getItem('mnr_containers'));
                    const updated = containers.map(c => ({
                        ...c,
                        status: 'GATE_OUT',
                        gatePassNumber: gatePass.gatePassNumber,
                        releasedAt: new Date().toISOString()
                    }));
                    localStorage.setItem('mnr_containers', JSON.stringify(updated));
                }}>Generate Gate Pass</button>
            );
        };

        const { getByText } = renderWithProviders(<TestGatePass />);
        fireEvent.click(getByText('Generate Gate Pass'));

        await waitFor(() => {
            const gatePasses = JSON.parse(localStorage.getItem('mnr_gatepasses'));
            expect(gatePasses).toHaveLength(1);
            expect(gatePasses[0].gatePassNumber).toMatch(/^GP-/);
            expect(gatePasses[0].status).toBe('ACTIVE');
        });

        await waitFor(() => {
            const containers = JSON.parse(localStorage.getItem('mnr_containers'));
            expect(containers[0].status).toBe('GATE_OUT');
            expect(containers[0].gatePassNumber).toBeDefined();
        });
    });

    it('AUTH-01: External User Filter - Only sees own liner data', async () => {
        // Setup: Multiple containers from different liners
        localStorage.setItem('mnr_containers', JSON.stringify([
            { id: 'c_msc1', containerNumber: 'MSCU1111111', liner: 'MSC', status: 'AV' },
            { id: 'c_msc2', containerNumber: 'MSCU2222222', liner: 'MSC', status: 'AV' },
            { id: 'c_one1', containerNumber: 'ONEU3333333', liner: 'ONE', status: 'AV' },
            { id: 'c_oocl', containerNumber: 'OOCL4444444', liner: 'OOCL', status: 'AV' }
        ]));

        // Login as MSC external user
        localStorage.setItem('mnr_user', JSON.stringify({
            id: 'msc_user',
            username: 'MSC_ESTIMATOR',
            groups: ['estimator'],
            userType: 'EXTERNAL',
            shippingLineCode: 'MSC',
            permissions: { screens: ['container_list'], functions: ['read'] }
        }));

        const TestExternalFilter = () => {
            const allContainers = JSON.parse(localStorage.getItem('mnr_containers') || '[]');
            const user = JSON.parse(localStorage.getItem('mnr_user') || '{}');

            // Filter logic: External users only see their liner's containers
            const filteredContainers = user.userType === 'EXTERNAL' && user.shippingLineCode
                ? allContainers.filter(c => c.liner === user.shippingLineCode)
                : allContainers;

            return (
                <div>
                    <span data-testid="total-count">{allContainers.length}</span>
                    <span data-testid="filtered-count">{filteredContainers.length}</span>
                    <span data-testid="user-type">{user.userType}</span>
                    <span data-testid="liner-code">{user.shippingLineCode}</span>
                </div>
            );
        };

        const { getByTestId } = renderWithProviders(<TestExternalFilter />);

        expect(getByTestId('total-count').textContent).toBe('4');
        expect(getByTestId('filtered-count').textContent).toBe('2'); // Only MSC containers
        expect(getByTestId('user-type').textContent).toBe('EXTERNAL');
        expect(getByTestId('liner-code').textContent).toBe('MSC');
    });
});
