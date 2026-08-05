// =================== GLOBAL STATE ===================
var state = {
  currentUser: null,
  dbConnected: false,
  sharedDBLoaded: false,
  sharedData: null,
  items: [],
  reserves: '',
  params: {
    filmType: 'non-pearl',   // "غیر صدفی"
    thickness: 20,
    standardLength: 20000,
    lowerLimit: 7960,
    upperLimit: 8020,
    maxArms: 10,             // "حداکثر بازو"
    maxTrim: 10,             // "حداکثر تریم مجاز"
    maxTime: 10              // "حداکثر زمان جستجو"
  },
  basePlan: {
    selectedRank: 1,
    criteria: [
      { field: 'repeat', dir: 'desc' },
      { field: 'totalCount', dir: 'asc' },
      { field: 'uniqueCount', dir: 'asc' },
      { field: 'total', dir: 'desc' }
    ]
  },
  plans: [],
  currentPlanPage: 0,
  resultsList: [],
  isRunning: false,
  progress: '',
  showAdmin: false,
  showEditProfile: false,
  showUserMenu: false,
  theme: 'dark',
  // مسیر و نام فایل دیتابیس اشتراکی – فقط همین دو خط را تغییر دهید
  dbFileName: 'sample_shared_db.json',
  dbFolder: '\\\\192.168.1.14\\Planning\\Plan\\Optimizer\\db\\'
};
const FIELD_LABELS = {
  repeat: 'حداکثر تکرار',
  totalCount: 'تعداد قطعات',
  uniqueCount: 'تنوع (عرض یکتا)',
  total: 'مجموع طول'
};