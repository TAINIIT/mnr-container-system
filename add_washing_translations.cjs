const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, 'src', 'i18n');

// All washing-related translations
const washingTranslations = {
    en: {
        "washing": {
            "title": "Washing Station",
            "subtitle": "Container cleaning and sanitization management",
            "newWashingOrder": "New Washing Order",
            "pendingApproval": "Pending Approval",
            "pendingSchedule": "Pending Schedule",
            "scheduled": "Scheduled",
            "inProgress": "In Progress",
            "pendingQC": "Pending QC",
            "rework": "Rework",
            "completedToday": "Completed Today",
            "searchPlaceholder": "Search container, liner...",
            "allBays": "All Bays",
            "allPrograms": "All Programs",
            "program": "Program",
            "bay": "Bay",
            "scheduledAt": "Scheduled",
            "noOrders": "No washing orders found",
            "readyForWashing": "Containers Ready for Washing",
            "createOrder": "Create Order",
            "cleaningStarted": "Cleaning started",
            "orderApproved": "Washing order approved",
            "orderRejected": "Washing order rejected",
            "enterRejectionReason": "Enter rejection reason:",
            "approve": "Approve",
            "reject": "Reject",
            "startCleaning": "Start Cleaning",
            "completeCleaning": "Complete & Submit for QC",
            "cleaningCompleted": "Cleaning completed, pending QC",
            "completeAllRequired": "Please complete all required items",
            "orderNotFound": "Washing order not found",
            "safetyNotes": "Safety Notes",
            "cleaningChecklist": "Cleaning Checklist",
            "workerNotes": "Worker Notes",
            "notesPlaceholder": "Any observations or issues...",
            "allRequiredMustPass": "All required items must pass",
            "qcPassed": "QC Passed! Certificate generated.",
            "selectReworkReasons": "Please select at least one rework reason",
            "qcFailed": "QC Failed. Order sent for rework.",
            "qcInspection": "QC Inspection",
            "cleaningProgram": "Cleaning Program",
            "elapsedTime": "Elapsed Time",
            "reworkAttempt": "Rework Attempt",
            "previousReworkReasons": "Previous issues",
            "qcChecklist": "QC Checklist",
            "pass": "Pass",
            "fail": "Fail",
            "reworkReasons": "Rework Reasons",
            "qcNotes": "QC Notes",
            "qcNotesPlaceholder": "Inspection observations...",
            "failAndRework": "Fail & Rework",
            "passAndCertify": "Pass & Generate Certificate",
            "selectContainerFirst": "Please select a container first",
            "orderCreated": "Washing order created",
            "assignedBay": "Assigned Bay",
            "assignedTeam": "Assigned Team",
            "selectBay": "Select Bay",
            "selectTeam": "Select Team"
        }
    },
    vi: {
        "washing": {
            "title": "Trạm Rửa Container",
            "subtitle": "Quản lý vệ sinh và khử trùng container",
            "newWashingOrder": "Tạo Lệnh Rửa Mới",
            "pendingApproval": "Chờ Phê Duyệt",
            "pendingSchedule": "Chờ Lên Lịch",
            "scheduled": "Đã Lên Lịch",
            "inProgress": "Đang Thực Hiện",
            "pendingQC": "Chờ QC",
            "rework": "Cần Làm Lại",
            "completedToday": "Hoàn Thành Hôm Nay",
            "searchPlaceholder": "Tìm container, hãng tàu...",
            "allBays": "Tất Cả Bãi",
            "allPrograms": "Tất Cả Chương Trình",
            "program": "Chương Trình",
            "bay": "Bãi",
            "scheduledAt": "Lịch Hẹn",
            "noOrders": "Không tìm thấy lệnh rửa",
            "readyForWashing": "Container Sẵn Sàng Rửa",
            "createOrder": "Tạo Lệnh",
            "cleaningStarted": "Bắt đầu rửa",
            "orderApproved": "Lệnh rửa đã được phê duyệt",
            "orderRejected": "Lệnh rửa đã bị từ chối",
            "enterRejectionReason": "Nhập lý do từ chối:",
            "approve": "Phê Duyệt",
            "reject": "Từ Chối",
            "startCleaning": "Bắt Đầu Rửa",
            "completeCleaning": "Hoàn Thành & Gửi QC",
            "cleaningCompleted": "Hoàn thành rửa, chờ QC",
            "completeAllRequired": "Vui lòng hoàn thành tất cả mục bắt buộc",
            "orderNotFound": "Không tìm thấy lệnh rửa",
            "safetyNotes": "Lưu Ý An Toàn",
            "cleaningChecklist": "Danh Sách Kiểm Tra Rửa",
            "workerNotes": "Ghi Chú Công Nhân",
            "notesPlaceholder": "Bất kỳ quan sát hoặc vấn đề nào...",
            "allRequiredMustPass": "Tất cả mục bắt buộc phải đạt",
            "qcPassed": "QC Đạt! Đã tạo chứng nhận.",
            "selectReworkReasons": "Vui lòng chọn ít nhất một lý do làm lại",
            "qcFailed": "QC Không Đạt. Đã gửi để làm lại.",
            "qcInspection": "Kiểm Tra QC",
            "cleaningProgram": "Chương Trình Rửa",
            "elapsedTime": "Thời Gian",
            "reworkAttempt": "Lần Làm Lại",
            "previousReworkReasons": "Vấn đề trước đó",
            "qcChecklist": "Danh Sách Kiểm Tra QC",
            "pass": "Đạt",
            "fail": "Không Đạt",
            "reworkReasons": "Lý Do Làm Lại",
            "qcNotes": "Ghi Chú QC",
            "qcNotesPlaceholder": "Quan sát kiểm tra...",
            "failAndRework": "Không Đạt & Làm Lại",
            "passAndCertify": "Đạt & Tạo Chứng Nhận",
            "selectContainerFirst": "Vui lòng chọn container trước",
            "orderCreated": "Đã tạo lệnh rửa",
            "assignedBay": "Bãi Được Giao",
            "assignedTeam": "Nhóm Được Giao",
            "selectBay": "Chọn Bãi",
            "selectTeam": "Chọn Nhóm"
        }
    },
    ms: {
        "washing": {
            "title": "Stesen Cucian",
            "subtitle": "Pengurusan pembersihan dan sanitasi kontena",
            "newWashingOrder": "Pesanan Cucian Baru",
            "pendingApproval": "Menunggu Kelulusan",
            "pendingSchedule": "Menunggu Jadual",
            "scheduled": "Dijadualkan",
            "inProgress": "Sedang Dijalankan",
            "pendingQC": "Menunggu QC",
            "rework": "Kerja Semula",
            "completedToday": "Siap Hari Ini",
            "searchPlaceholder": "Cari kontena, liner...",
            "allBays": "Semua Bay",
            "allPrograms": "Semua Program",
            "program": "Program",
            "bay": "Bay",
            "scheduledAt": "Dijadualkan",
            "noOrders": "Tiada pesanan cucian ditemui",
            "readyForWashing": "Kontena Sedia Untuk Cucian",
            "createOrder": "Cipta Pesanan",
            "cleaningStarted": "Pembersihan dimulakan",
            "orderApproved": "Pesanan cucian diluluskan",
            "orderRejected": "Pesanan cucian ditolak",
            "enterRejectionReason": "Masukkan sebab penolakan:",
            "approve": "Luluskan",
            "reject": "Tolak",
            "startCleaning": "Mulakan Cucian",
            "completeCleaning": "Selesai & Hantar ke QC",
            "cleaningCompleted": "Pembersihan selesai, menunggu QC",
            "completeAllRequired": "Sila lengkapkan semua item yang diperlukan",
            "orderNotFound": "Pesanan cucian tidak ditemui",
            "safetyNotes": "Nota Keselamatan",
            "cleaningChecklist": "Senarai Semak Pembersihan",
            "workerNotes": "Nota Pekerja",
            "notesPlaceholder": "Sebarang pemerhatian atau isu...",
            "allRequiredMustPass": "Semua item yang diperlukan mesti lulus",
            "qcPassed": "QC Lulus! Sijil dijana.",
            "selectReworkReasons": "Sila pilih sekurang-kurangnya satu sebab kerja semula",
            "qcFailed": "QC Gagal. Pesanan dihantar untuk kerja semula.",
            "qcInspection": "Pemeriksaan QC",
            "cleaningProgram": "Program Cucian",
            "elapsedTime": "Masa Berlalu",
            "reworkAttempt": "Percubaan Kerja Semula",
            "previousReworkReasons": "Isu sebelumnya",
            "qcChecklist": "Senarai Semak QC",
            "pass": "Lulus",
            "fail": "Gagal",
            "reworkReasons": "Sebab Kerja Semula",
            "qcNotes": "Nota QC",
            "qcNotesPlaceholder": "Pemerhatian pemeriksaan...",
            "failAndRework": "Gagal & Kerja Semula",
            "passAndCertify": "Lulus & Jana Sijil",
            "selectContainerFirst": "Sila pilih kontena dahulu",
            "orderCreated": "Pesanan cucian dicipta",
            "assignedBay": "Bay Ditugaskan",
            "assignedTeam": "Pasukan Ditugaskan",
            "selectBay": "Pilih Bay",
            "selectTeam": "Pilih Pasukan"
        }
    },
    ko: {
        "washing": {
            "title": "세척 스테이션",
            "subtitle": "컨테이너 세척 및 소독 관리",
            "newWashingOrder": "새 세척 주문",
            "pendingApproval": "승인 대기",
            "pendingSchedule": "일정 대기",
            "scheduled": "예약됨",
            "inProgress": "진행 중",
            "pendingQC": "QC 대기",
            "rework": "재작업",
            "completedToday": "오늘 완료",
            "searchPlaceholder": "컨테이너, 선사 검색...",
            "allBays": "모든 베이",
            "allPrograms": "모든 프로그램",
            "program": "프로그램",
            "bay": "베이",
            "scheduledAt": "예약일",
            "noOrders": "세척 주문 없음",
            "readyForWashing": "세척 준비된 컨테이너",
            "createOrder": "주문 생성",
            "cleaningStarted": "세척 시작됨",
            "orderApproved": "세척 주문 승인됨",
            "orderRejected": "세척 주문 거부됨",
            "enterRejectionReason": "거부 사유 입력:",
            "approve": "승인",
            "reject": "거부",
            "startCleaning": "세척 시작",
            "completeCleaning": "완료 및 QC 제출",
            "cleaningCompleted": "세척 완료, QC 대기",
            "completeAllRequired": "필수 항목을 모두 완료하세요",
            "orderNotFound": "세척 주문을 찾을 수 없음",
            "safetyNotes": "안전 참고사항",
            "cleaningChecklist": "세척 체크리스트",
            "workerNotes": "작업자 메모",
            "notesPlaceholder": "관찰 사항 또는 문제...",
            "allRequiredMustPass": "모든 필수 항목이 통과해야 함",
            "qcPassed": "QC 통과! 인증서 생성됨.",
            "selectReworkReasons": "재작업 사유를 하나 이상 선택하세요",
            "qcFailed": "QC 실패. 재작업으로 전송됨.",
            "qcInspection": "QC 검사",
            "cleaningProgram": "세척 프로그램",
            "elapsedTime": "경과 시간",
            "reworkAttempt": "재작업 시도",
            "previousReworkReasons": "이전 문제",
            "qcChecklist": "QC 체크리스트",
            "pass": "통과",
            "fail": "실패",
            "reworkReasons": "재작업 사유",
            "qcNotes": "QC 메모",
            "qcNotesPlaceholder": "검사 관찰사항...",
            "failAndRework": "실패 및 재작업",
            "passAndCertify": "통과 및 인증서 생성",
            "selectContainerFirst": "먼저 컨테이너를 선택하세요",
            "orderCreated": "세척 주문 생성됨",
            "assignedBay": "배정된 베이",
            "assignedTeam": "배정된 팀",
            "selectBay": "베이 선택",
            "selectTeam": "팀 선택"
        }
    },
    zh: {
        "washing": {
            "title": "洗箱站",
            "subtitle": "集装箱清洁和消毒管理",
            "newWashingOrder": "新建洗箱订单",
            "pendingApproval": "待审批",
            "pendingSchedule": "待排期",
            "scheduled": "已排期",
            "inProgress": "进行中",
            "pendingQC": "待质检",
            "rework": "返工",
            "completedToday": "今日完成",
            "searchPlaceholder": "搜索集装箱、船公司...",
            "allBays": "所有泊位",
            "allPrograms": "所有程序",
            "program": "清洗程序",
            "bay": "泊位",
            "scheduledAt": "排期时间",
            "noOrders": "未找到洗箱订单",
            "readyForWashing": "待洗集装箱",
            "createOrder": "创建订单",
            "cleaningStarted": "清洗已开始",
            "orderApproved": "洗箱订单已审批",
            "orderRejected": "洗箱订单已拒绝",
            "enterRejectionReason": "请输入拒绝原因：",
            "approve": "审批",
            "reject": "拒绝",
            "startCleaning": "开始清洗",
            "completeCleaning": "完成并提交质检",
            "cleaningCompleted": "清洗完成，待质检",
            "completeAllRequired": "请完成所有必填项",
            "orderNotFound": "未找到洗箱订单",
            "safetyNotes": "安全提示",
            "cleaningChecklist": "清洗检查清单",
            "workerNotes": "工人备注",
            "notesPlaceholder": "任何观察或问题...",
            "allRequiredMustPass": "所有必填项必须通过",
            "qcPassed": "质检通过！证书已生成。",
            "selectReworkReasons": "请至少选择一个返工原因",
            "qcFailed": "质检未通过。订单已发送返工。",
            "qcInspection": "质量检验",
            "cleaningProgram": "清洗程序",
            "elapsedTime": "用时",
            "reworkAttempt": "返工次数",
            "previousReworkReasons": "之前的问题",
            "qcChecklist": "质检清单",
            "pass": "通过",
            "fail": "不通过",
            "reworkReasons": "返工原因",
            "qcNotes": "质检备注",
            "qcNotesPlaceholder": "检查观察...",
            "failAndRework": "不通过并返工",
            "passAndCertify": "通过并生成证书",
            "selectContainerFirst": "请先选择集装箱",
            "orderCreated": "洗箱订单已创建",
            "assignedBay": "分配泊位",
            "assignedTeam": "分配团队",
            "selectBay": "选择泊位",
            "selectTeam": "选择团队"
        }
    },
    pt: {
        "washing": {
            "title": "Estação de Lavagem",
            "subtitle": "Gestão de limpeza e higienização de contentores",
            "newWashingOrder": "Nova Ordem de Lavagem",
            "pendingApproval": "Aguardando Aprovação",
            "pendingSchedule": "Aguardando Agendamento",
            "scheduled": "Agendado",
            "inProgress": "Em Progresso",
            "pendingQC": "Aguardando QC",
            "rework": "Retrabalho",
            "completedToday": "Concluído Hoje",
            "searchPlaceholder": "Pesquisar contentor, armador...",
            "allBays": "Todas as Baías",
            "allPrograms": "Todos os Programas",
            "program": "Programa",
            "bay": "Baía",
            "scheduledAt": "Agendado",
            "noOrders": "Nenhuma ordem de lavagem encontrada",
            "readyForWashing": "Contentores Prontos para Lavagem",
            "createOrder": "Criar Ordem",
            "cleaningStarted": "Limpeza iniciada",
            "orderApproved": "Ordem de lavagem aprovada",
            "orderRejected": "Ordem de lavagem rejeitada",
            "enterRejectionReason": "Insira o motivo da rejeição:",
            "approve": "Aprovar",
            "reject": "Rejeitar",
            "startCleaning": "Iniciar Limpeza",
            "completeCleaning": "Concluir e Enviar para QC",
            "cleaningCompleted": "Limpeza concluída, aguardando QC",
            "completeAllRequired": "Por favor, complete todos os itens obrigatórios",
            "orderNotFound": "Ordem de lavagem não encontrada",
            "safetyNotes": "Notas de Segurança",
            "cleaningChecklist": "Lista de Verificação de Limpeza",
            "workerNotes": "Notas do Trabalhador",
            "notesPlaceholder": "Quaisquer observações ou problemas...",
            "allRequiredMustPass": "Todos os itens obrigatórios devem passar",
            "qcPassed": "QC Aprovado! Certificado gerado.",
            "selectReworkReasons": "Por favor, selecione pelo menos um motivo de retrabalho",
            "qcFailed": "QC Reprovado. Ordem enviada para retrabalho.",
            "qcInspection": "Inspeção de QC",
            "cleaningProgram": "Programa de Limpeza",
            "elapsedTime": "Tempo Decorrido",
            "reworkAttempt": "Tentativa de Retrabalho",
            "previousReworkReasons": "Problemas anteriores",
            "qcChecklist": "Lista de Verificação de QC",
            "pass": "Aprovado",
            "fail": "Reprovado",
            "reworkReasons": "Motivos de Retrabalho",
            "qcNotes": "Notas de QC",
            "qcNotesPlaceholder": "Observações da inspeção...",
            "failAndRework": "Reprovar e Retrabalhar",
            "passAndCertify": "Aprovar e Gerar Certificado",
            "selectContainerFirst": "Por favor, selecione um contentor primeiro",
            "orderCreated": "Ordem de lavagem criada",
            "assignedBay": "Baía Atribuída",
            "assignedTeam": "Equipa Atribuída",
            "selectBay": "Selecionar Baía",
            "selectTeam": "Selecionar Equipa"
        }
    }
};

// Inspection-related translations (add to existing inspection section if exists)
const inspectionTranslations = {
    en: {
        "inspection": {
            "postRepairCleaning": "Post-Repair Cleaning",
            "damageVerification": "Damage Items Verification",
            "damageVerificationDesc": "Verify that each damage item from the survey has been properly repaired.",
            "repaired": "Repaired",
            "notRepaired": "Not Fixed",
            "generalChecklist": "General Inspection Checklist",
            "repairsVerified": "Repairs Verified"
        }
    },
    vi: {
        "inspection": {
            "postRepairCleaning": "Vệ Sinh Sau Sửa Chữa",
            "damageVerification": "Xác Nhận Hạng Mục Hư Hỏng",
            "damageVerificationDesc": "Xác nhận rằng mỗi hạng mục hư hỏng từ khảo sát đã được sửa chữa đúng cách.",
            "repaired": "Đã Sửa",
            "notRepaired": "Chưa Sửa",
            "generalChecklist": "Danh Sách Kiểm Tra Tổng Quát",
            "repairsVerified": "Sửa Chữa Đã Xác Nhận"
        }
    },
    ms: {
        "inspection": {
            "postRepairCleaning": "Pembersihan Selepas Pembaikan",
            "damageVerification": "Pengesahan Item Kerosakan",
            "damageVerificationDesc": "Sahkan bahawa setiap item kerosakan dari tinjauan telah dibaiki dengan betul.",
            "repaired": "Dibaiki",
            "notRepaired": "Tidak Dibaiki",
            "generalChecklist": "Senarai Semak Pemeriksaan Am",
            "repairsVerified": "Pembaikan Disahkan"
        }
    },
    ko: {
        "inspection": {
            "postRepairCleaning": "수리 후 청소",
            "damageVerification": "손상 항목 확인",
            "damageVerificationDesc": "조사에서 각 손상 항목이 제대로 수리되었는지 확인합니다.",
            "repaired": "수리됨",
            "notRepaired": "미수리",
            "generalChecklist": "일반 검사 체크리스트",
            "repairsVerified": "수리 확인됨"
        }
    },
    zh: {
        "inspection": {
            "postRepairCleaning": "修后清洁",
            "damageVerification": "损坏项目验证",
            "damageVerificationDesc": "验证调查中的每个损坏项目是否已正确修复。",
            "repaired": "已修复",
            "notRepaired": "未修复",
            "generalChecklist": "一般检查清单",
            "repairsVerified": "已验证修复"
        }
    },
    pt: {
        "inspection": {
            "postRepairCleaning": "Limpeza Pós-Reparação",
            "damageVerification": "Verificação de Itens Danificados",
            "damageVerificationDesc": "Verifique se cada item de dano na pesquisa foi reparado corretamente.",
            "repaired": "Reparado",
            "notRepaired": "Não Reparado",
            "generalChecklist": "Lista de Verificação de Inspeção Geral",
            "repairsVerified": "Reparações Verificadas"
        }
    }
};

// Container status translations
const containerStatusTranslations = {
    en: {
        "containerStatus": {
            "PENDING_WASH": "Pending Wash",
            "WASHING": "Washing"
        }
    },
    vi: {
        "containerStatus": {
            "PENDING_WASH": "Chờ Rửa",
            "WASHING": "Đang Rửa"
        }
    },
    ms: {
        "containerStatus": {
            "PENDING_WASH": "Menunggu Cucian",
            "WASHING": "Sedang Dicuci"
        }
    },
    ko: {
        "containerStatus": {
            "PENDING_WASH": "세척 대기",
            "WASHING": "세척 중"
        }
    },
    zh: {
        "containerStatus": {
            "PENDING_WASH": "待洗箱",
            "WASHING": "清洗中"
        }
    },
    pt: {
        "containerStatus": {
            "PENDING_WASH": "Aguardando Lavagem",
            "WASHING": "Em Lavagem"
        }
    }
};

// Add nav.washingStation
const navTranslations = {
    en: { "nav": { "washingStation": "Washing Station" } },
    vi: { "nav": { "washingStation": "Trạm Rửa Container" } },
    ms: { "nav": { "washingStation": "Stesen Cucian" } },
    ko: { "nav": { "washingStation": "세척 스테이션" } },
    zh: { "nav": { "washingStation": "洗箱站" } },
    pt: { "nav": { "washingStation": "Estação de Lavagem" } }
};

const languages = ['en', 'vi', 'ms', 'ko', 'zh', 'pt'];

function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

let updatedCount = 0;

languages.forEach(lang => {
    const filePath = path.join(i18nDir, `${lang}.json`);
    console.log(`Processing ${lang}.json...`);

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        // Merge translations
        if (washingTranslations[lang]) {
            deepMerge(data, washingTranslations[lang]);
        }
        if (inspectionTranslations[lang]) {
            deepMerge(data, inspectionTranslations[lang]);
        }
        if (containerStatusTranslations[lang]) {
            deepMerge(data, containerStatusTranslations[lang]);
        }
        if (navTranslations[lang]) {
            deepMerge(data, navTranslations[lang]);
        }

        // Write back
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8');
        console.log(`  ✓ Updated ${lang}.json`);
        updatedCount++;
    } catch (err) {
        console.error(`  ✗ Error processing ${lang}.json:`, err.message);
    }
});

console.log(`\nDone! Updated ${updatedCount} language files.`);
