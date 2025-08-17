/**
 * i18n.ts
 * Global i18next initialization with six languages and HTML lang/dir syncing.
 * - Robust language detection (saved -> navigator -> en).
 * - RTL for Arabic.
 * - This version expands translations to cover Home, Referrals, Run, Wallet pages
 *   and shared components to avoid missing-key fallbacks like showing "settings".
 * - Update: Fill missing keys for ProfileEdit, KYC, GA Setup, Deposit, Withdrawals, Transfer,
 *   and related hints to avoid leaking key paths or component names in UI.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

/**
 * applyHtmlLangDir
 * Sync <html> lang and dir with current language.
 */
function applyHtmlLangDir(lng: string) {
  try {
    document.documentElement.lang = lng
    const rtlLangs = new Set(['ar'])
    document.documentElement.dir = rtlLangs.has(lng) ? 'rtl' : 'ltr'
  } catch {}
}

/**
 * detectInitialLanguage
 * Read saved language or detect from navigator, constrained to supported set.
 */
function detectInitialLanguage(): string {
  const supported = ['en', 'zh', 'hi', 'ar', 'es', 'pt']
  try {
    const saved = localStorage.getItem('pref_lang')
    if (saved && supported.includes(saved)) return saved
  } catch {}
  try {
    const nav = (navigator.language || 'en').slice(0, 2)
    if (supported.includes(nav)) return nav
  } catch {}
  return 'en'
}

const saved = detectInitialLanguage()

/**
 * resources
 * Expanded translation resources.
 * - en/zh are fully covered for Home/Referrals/Run/Wallet and shared pieces.
 * - hi/ar/es/pt provide login basics and language names; other keys fallback to en.
 * - Update: add missing keys for profile edit, KYC, GA setup, deposit, withdrawals, transfer pages.
 */
const resources = {
  en: {
    translation: {
      appName: 'CCRC AD',

      // Language names
      lang: {
        en: 'English',
        zh: '简体中文',
        hi: 'हिन्दी',
        ar: 'العربية',
        es: 'Español',
        pt: 'Português',
      },

      // Common actions
      actions: {
        deposit: 'Deposit',
        withdraw: 'Withdraw',
        exchange: 'Exchange',
        cancel: 'Cancel',
        save: 'Save',
        logout: 'Log out',
        back: 'Back',
        copy: 'Copy',
        share: 'Share',
        exportCSV: 'Export CSV',
        send: 'Send', // used by register toast
      },

      // Toasts
      toast: {
        copySuccess: 'Copied',
        copyError: 'Copy failed. Please try again.',
      },

      // Header / Nav
      nav: {
        dashboard: 'Dashboard',
        ledger: 'Ledger',
        wallet: 'Wallet',
        withdrawals: 'Withdrawals',
        referrals: 'Referrals',
        kyc: 'KYC',
        settings: 'Settings',
        run: 'Run',
      },
      header: {
        notifications: 'Notifications',
        runPromo: 'Boost your earnings with smart automation',
        depositRecords: 'Deposit Records',
      },

      // Settings groups and pages
      settings: {
        language: { title: 'Language', desc: 'Switch the interface language.' },

        // Settings page/quick settings buckets
        sections: {
          account: 'Account',
          security: 'Security',
          platform: 'Platform',
        },
        profileEdit: {
          title: 'Profile',
          desc: 'Edit your basic information and avatar.',
          fields: {
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
          },
          actions: {
            upload: 'Upload',
            remove: 'Remove',
            edit: 'Edit',
          },
          tips: {
            size: 'JPG/PNG, up to 2MB. A square picture works best.',
          },
          errors: {
            tooLarge: 'Image is too large.',
            notImage: 'Please upload an image file.',
          },
        },
        changePassword: {
          title: 'Change password',
          desc: 'Update your account password.',
          fields: {
            old: 'Current password',
            new: 'New password',
            confirm: 'Confirm new password',
            otp: 'Google Authenticator code',
          },
          errors: {
            old: 'Please enter your current password',
            len: 'Password must be at least 6 characters',
            confirm: 'Passwords do not match',
            gaBind: 'Please bind Google Authenticator first',
            otp: 'Please enter a valid 6-digit code',
          },
          success: 'Password updated',
        },
        kyc: {
          title: 'Identity verification',
          desc: 'Verify your identity to unlock higher limits.',
          status: {
            NOT_STARTED: 'Not started',
            IN_REVIEW: 'In review',
            VERIFIED: 'Verified',
            REJECTED: 'Rejected',
          },
          // Added for KYC page
          docType: {
            title: 'Document type',
            passport: 'Passport',
            idCard: 'ID card',
            driverLicense: 'Driver’s license',
          },
          fields: {
            fullName: 'Full name',
            idNumber: 'Document number',
            photo: 'Document photo',
          },
          placeholders: {
            fullName: 'Jane Doe',
            idNumber: 'ABC123456',
          },
          upload: {
            cta: 'Upload document photo',
          },
          tips: {
            photo: 'Ensure the entire document is visible and readable.',
          },
          errors: {
            photoRequired: 'Please upload a document photo.',
          },
          submitting: 'Submitting…',
          submit: 'Submit for review',
          note: 'Your information will be used only for verification purposes.',
          verifiedTip: 'Your identity has been verified.',
        },
        ga: {
          title: 'Google Authenticator',
          desc: 'Protect your account with 2‑step verification.',
          on: 'Bound',
          off: 'Unbound',
          // Added for GA setup page
          step1: 'Scan the QR code in Google Authenticator',
          step2: 'If scanning fails, add the secret key manually.',
          step3: 'Enter the 6‑digit code to bind',
          secret: 'Secret key',
          bind: 'Bind',
          invalid: 'Please enter a valid 6-digit code',
        },
        theme: {
          title: 'Theme',
          desc: 'Switch between light and dark.',
        },
        support: {
          title: 'Contact support (Telegram)',
          desc: 'Get help from our team on Telegram.',
        },
        about: {
          title: 'About',
          desc: 'Learn more about this platform.',
        },
        logout: {
          title: 'Log out',
          desc: 'Sign out from this device.',
          confirm: 'Are you sure you want to log out?',
        },
      },

      // Standalone logout confirmation (used in AppLayout/Login)
      logout: {
        confirmTitle: 'Log out',
        confirmDesc: 'Are you sure you want to log out? You will return to the sign-in page.',
        success: 'Logged out',
      },

      // Login / Register (subset)
      login: {
        title: 'Welcome back',
        subtitle: 'Sign in to continue',
        email: 'Email',
        password: 'Password',
        otp: 'Google Authenticator code',
        otpPlaceholder: '6-digit code',
        signIn: 'Sign in',
        signingIn: 'Signing in…',
        checking: 'Checking account…',
        success: 'Signed in',
        failed: 'Sign-in failed',
        notice: 'Use jane@example.com for GA-bound demo (OTP required).',
        hintPassword: 'Demo password: demo123',
        hintOtp: 'Demo OTP: 123456',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        errors: {
          required: 'This field is required',
          invalidEmail: 'Please enter a valid email',
          otp: 'Please enter a valid 6-digit code',
        },
      },

      register: {
        link: 'Create an account',
        title: 'Create your account',
        subtitle: 'Register with email verification',
        fields: {
          email: 'Email',
          username: 'Username',
          password: 'Password',
          confirmPassword: 'Confirm password',
          code: 'Verification code',
        },
        actions: {
          sendCode: 'Send code',
          resendIn: 'Resend in {{s}}s',
          register: 'Register',
          backToLogin: 'Back to sign in',
        },
        hints: {
          demoCode: 'A demo code has been sent (shown in the toast).',
          passwordRule: 'At least 6 characters',
        },
        errors: {
          required: 'This field is required',
          invalidEmail: 'Please enter a valid email',
          usernameTaken: 'This username is already taken',
          emailTaken: 'This email has already been registered',
          passwordLength: 'Password must be at least 6 characters',
          passwordMismatch: 'Passwords do not match',
          codeInvalid: 'Invalid verification code',
          codeExpired: 'Verification code has expired, please resend',
        },
        success: 'Registration successful. Please sign in.',
      },

      // Wallet texts
      wallet: {
        accountBalance: 'Account Balance',
        runningAmount: 'Running Amount',
        totalEarnings: 'Total Earnings',
        yesterday: 'Yesterday',
        today: 'Today',
        available: 'Available',
        accruing: 'Accruing',
        allTime: 'All-time',
        earnings: 'Earnings',
        depositSoon: 'Deposit is coming soon. Please contact support or use the official top-up channel.',
        exchangeSoon: 'Exchange is coming soon. Please stay tuned.',
      },

      // Yesterday KPI card (Wallet)
      yesterdayCard: {
        grossLabel: 'Gross',
        feeLabel: 'Service fee (20%)',
        note: 'Net = Gross − 20% fee. Payout is sent the next day.',
        status: {
          sent: 'Payout sent',
          partial: 'Partially paid',
          pending: 'Pending',
        },
      },

      // Records / Exchange / Transfer titles
      depositRecords: { title: 'Deposit Records' },
      withdrawalRecords: { title: 'Withdrawal Records' },
      exchange: {
        title: 'Exchange',
        records: {
          title: 'Exchange Records',
        },
      },
      transferPage: {
        title: 'Internal Transfer',
        cta: 'Internal Transfer (0 fee)',
        subtitle: 'Search a friend by Account ID to transfer internally.',
        accountId: 'Account ID',
        searching: 'Searching…',
        search: 'Search',
        notFound: 'No user found for this Account ID',
        formTitle: 'Transfer amount',
        fee: 'Fee',
        deducted: 'Deducted',
        submit: 'Transfer',
        success: 'Transfer sent',
        tips: {
          verify: 'Verify the recipient’s avatar, name and Account ID carefully before you proceed.',
          noFee: 'Internal transfer is fee-free.',
          otp: 'Google Authenticator (OTP) is required to submit.',
        },
      },

      // Run page
      run: {
        orders: 'Orders',
        noOrders: 'No orders yet today.',
        address: 'Address',
      },

      // Home page (compliance block)
      home: {
        complianceNote: {
          title: 'Compliance and partnership statement',
          points: [
            'We cooperate strictly under each platform’s Terms of Service and applicable laws.',
            'Assistance only covers compliant, publicly promoted tasks; no fake traffic, manipulation, or abuse.',
            'Data is processed under our privacy policy and used only for matching and settlement needs.',
            'If a platform requests restriction or takedown, related tasks will be stopped immediately.',
          ],
        },
      },

      // Referrals page
      referralsPage: {
        title: 'Invite friends to earn rewards',
        subtitle: 'Two-level referral program with transparent rules.',
        link: {
          title: 'Invitation link',
          code: 'Invitation code',
          tip: 'Share your link or code to invite friends.',
        },
        stats: {
          firstDeposit: 'First-deposit bonus (Level 1)',
          firstDepositSub: '30% of friend’s first deposit',
          today: 'Estimated today’s share',
          todaySub: '10% L1 + 5% L2 of today’s profits',
          total: 'Total rewards',
          totalSub: 'All qualified rewards',
        },
        rules: {
          title: 'Reward rules',
          level1: { title: 'Level 1', desc: '10% of daily profit; 30% first-deposit bonus.' },
          level2: { title: 'Level 2', desc: '5% of daily profit; no first-deposit bonus.' },
        },
        filter: {
          searchPlaceholder: 'Search name...',
          sort: {
            label: 'Sort by',
            joinedDesc: 'Join date (newest)',
            firstDepositDesc: 'First deposit (desc)',
            todayProfitDesc: 'Today’s profit (desc)',
            nameAsc: 'Name (A → Z)',
          },
        },
        level1: {
          title: 'Level 1',
          tip: 'First-deposit bonus applies to Level 1 only.',
          empty: 'No Level-1 friends yet.',
          badge: 'L1',
        },
        level2: {
          title: 'Level 2',
          tip: 'Level 2 earns 5% of daily profits.',
          empty: 'No Level-2 friends yet.',
          badge: 'L2',
        },
        perLevel: {
          l1: {
            rewardFirstTotal: 'L1 first-deposit bonus',
            todayShare: 'L1 estimated today’s share',
          },
          l2: {
            todayShare: 'L2 estimated today’s share',
          },
        },
        joinedAtLabel: 'Joined',
        friend: {
          firstDeposit: 'Friend’s first deposit',
          yourFirstReward: 'Your first-deposit bonus',
          friendTodayProfit: 'Friend’s today profit',
          yourShare: 'Your share ({{rate}})',
          level2NoFirst: 'No first-deposit bonus for Level 2',
        },
        emptyFiltered: 'No results match your filters.',
      },

      // Withdrawals page (new keys)
      withdrawalsPage: {
        availableBalance: 'Available balance',
        feeNote: '1% platform fee applies. Crypto withdrawals (BTC/ETH) also consider network miner fees at destination.',
        selectNetworkTip: 'Select the correct network before you enter your address.',
        destAddress: 'Destination address',
        amount: 'Amount ({{sym}})',
        max: 'MAX',
        balance: 'Balance:',
        amountLabel: 'Amount',
        fee1: 'Fee (1%)',
        deducted: 'Deducted',
        submitting: 'Submitting…',
        submit: 'Request withdrawal',
        tips: {
          match: 'Make sure the address matches the selected network.',
          exchangeSupport: 'You can exchange between BTC/ETH and USDT on the Exchange page.',
          minerFee: 'Miner/network fees may be charged by the destination network.',
        },
        otp: {
          title: 'Google Authenticator (OTP)',
          desc: 'Enter the 6-digit code to verify and submit.',
          notBound: 'Google Authenticator is not bound on your account.',
          first: 'Please bind it first to proceed.',
          code6: '6-digit code',
          invalid: 'Please enter a valid 6-digit code',
          bindFirst: 'Please bind Google Authenticator first',
          verifying: 'Verifying…',
          verifySubmit: 'Verify and submit',
        },
        requested: 'Withdrawal request submitted',
        requestFailed: 'Request failed',
      },
      // Withdrawals address hints (separate namespace)
      withdrawals: {
        hints: {
          mismatch: 'This address does not match the selected network.',
          detectedTRC20: 'Detected a Tron (TRC20) address.',
          detectedBTC: 'Detected a Bitcoin (BTC) address.',
          detectedEVM: 'Detected an EVM 0x address.',
          selectEVM: 'Select ERC20/ETH/BEP20 network.',
        },
      },
    },
  },

  zh: {
    translation: {
      appName: 'CCRC AD',

      lang: {
        en: 'English',
        zh: '简体中文',
        hi: 'हिन्दी',
        ar: 'العربية',
        es: 'Español',
        pt: 'Português',
      },

      actions: {
        deposit: '充值',
        withdraw: '提现',
        exchange: '兑换',
        cancel: '取消',
        save: '保存',
        logout: '退出登录',
        back: '返回',
        copy: '复制',
        share: '分享',
        exportCSV: '导出 CSV',
        send: '已发送',
      },

      toast: {
        copySuccess: '已复制',
        copyError: '复制失败，请重试',
      },

      nav: {
        dashboard: '概览',
        ledger: '账单',
        wallet: '钱包',
        withdrawals: '提现',
        referrals: '邀请',
        kyc: '实名认证',
        settings: '设置',
        run: '运行',
      },
      header: {
        notifications: '通知',
        runPromo: '智能助力，提升收益',
        depositRecords: '充值记录',
      },

      settings: {
        language: { title: '语言', desc: '切换界面显示语言。' },

        sections: {
          account: '账户',
          security: '安全',
          platform: '平台',
        },
        profileEdit: {
          title: '个人资料',
          desc: '编辑头像与基础信息。',
          fields: {
            name: '昵称',
            email: '邮箱',
            phone: '手机号',
          },
          actions: {
            upload: '上传',
            remove: '移除',
            edit: '编辑',
          },
          tips: {
            size: 'JPG/PNG，最大 2MB，建议使用方形图片。',
          },
          errors: {
            tooLarge: '图片过大。',
            notImage: '请上传图片文件。',
          },
        },
        changePassword: {
          title: '修改密码',
          desc: '更新你的账户密码。',
          fields: {
            old: '当前密码',
            new: '新密码',
            confirm: '确认新密码',
            otp: '谷歌验证码',
          },
          errors: {
            old: '请输入当前密码',
            len: '密码至少 6 位',
            confirm: '两次输入的密码不一致',
            gaBind: '请先绑定谷歌验证',
            otp: '请输入 6 位数字验证码',
          },
          success: '密码已更新',
        },
        kyc: {
          title: '实名认证',
          desc: '完成身份验证以提升额度。',
          status: {
            NOT_STARTED: '未开始',
            IN_REVIEW: '审核中',
            VERIFIED: '已通过',
            REJECTED: '已驳回',
          },
          // 新增：KYC 页面所需键
          docType: {
            title: '证件类型',
            passport: '护照',
            idCard: '身份证',
            driverLicense: '驾驶证',
          },
          fields: {
            fullName: '姓名',
            idNumber: '证件号',
            photo: '证件照片',
          },
          placeholders: {
            fullName: '张三',
            idNumber: 'ABC123456',
          },
          upload: {
            cta: '上传证件照片',
          },
          tips: {
            photo: '请确保证件完整清晰可见。',
          },
          errors: {
            photoRequired: '请先上传证件照片。',
          },
          submitting: '提交中…',
          submit: '提交审核',
          note: '你的信息仅用于身份核验。',
          verifiedTip: '你的实名认证已通过。',
        },
        ga: {
          title: '谷歌验证',
          desc: '启用两步验证保护账户安全。',
          on: '已绑定',
          off: '未绑定',
          // 新增：GA 绑定页面所需键
          step1: '在 Google 身份验证器中扫描二维码',
          step2: '若无法扫描，可手动输入密钥添加。',
          step3: '输入 6 位验证码完成绑定',
          secret: '密钥',
          bind: '绑定',
          invalid: '请输入 6 位数字验证码',
        },
        theme: {
          title: '主题',
          desc: '在浅色与深色主题间切换。',
        },
        support: {
          title: '联系客服（Telegram）',
          desc: '在 Telegram 上获得帮助。',
        },
        about: {
          title: '关于我们',
          desc: '了解更多平台信息。',
        },
        logout: {
          title: '退出登录',
          desc: '从当前设备安全退出。',
          confirm: '确认要退出登录吗？',
        },
      },

      logout: {
        confirmTitle: '确认退出',
        confirmDesc: '退出后将返回登录页面。',
        success: '已退出登录',
      },

      login: {
        title: '欢迎回来',
        subtitle: '登录以继续',
        email: '邮箱',
        password: '密码',
        otp: '谷歌验证码',
        otpPlaceholder: '6 位验证码',
        signIn: '登录',
        signingIn: '登录中…',
        checking: '正在检测账户…',
        success: '登录成功',
        failed: '登录失败',
        notice: '使用 jane@example.com 演示“已绑定谷歌验证”账号（需输入 OTP）。',
        hintPassword: '演示密码：demo123',
        hintOtp: '演示验证码：123456',
        showPassword: '显示密码',
        hidePassword: '隐藏密码',
        errors: {
          required: '必填项',
          invalidEmail: '请输入有效邮箱',
          otp: '请输入 6 位数字验证码',
        },
      },

      register: {
        link: '马上注册',
        title: '创建你的账户',
        subtitle: '通过邮箱验证码完成注册',
        fields: {
          email: '邮箱',
          username: '用户名',
          password: '密码',
          confirmPassword: '确认密码',
          code: '验证码',
        },
        actions: {
          sendCode: '发送验证码',
          resendIn: '{{s}} 秒后可重发',
          register: '注册',
          backToLogin: '返回登录',
        },
        hints: {
          demoCode: '演示验证码将通过提示弹窗显示。',
          passwordRule: '至少 6 个字符',
        },
        errors: {
          required: '必填项',
          invalidEmail: '请输入有效邮箱',
          usernameTaken: '该用户名已被使用',
          emailTaken: '该邮箱已被注册',
          passwordLength: '密码至少 6 位',
          passwordMismatch: '两次输入的密码不一致',
          codeInvalid: '验证码不正确',
          codeExpired: '验证码已过期，请重新发送',
        },
        success: '注册成功，请前往登录。',
      },

      wallet: {
        accountBalance: '账户余额',
        runningAmount: '运行金额',
        totalEarnings: '总收益',
        yesterday: '昨日',
        today: '今日',
        available: '可用',
        accruing: '累计中',
        allTime: '全部时间',
        earnings: '收益',
        depositSoon: '充值即将上线，请联系支持或使用官方通道。',
        exchangeSoon: '兑换功能即将上线，敬请期待。',
      },

      yesterdayCard: {
        grossLabel: '总额',
        feeLabel: '服务费（20%）',
        note: '净额 = 总额 − 20% 服务费；次日发放。',
        status: {
          sent: '已发放',
          partial: '部分发放',
          pending: '待发放',
        },
      },

      depositRecords: { title: '充值记录' },
      withdrawalRecords: { title: '提现记录' },
      exchange: {
        title: '兑换',
        records: { title: '兑换记录' },
      },
      transferPage: {
        title: '站内转账',
        cta: '站内转账（0 手续费）',
        subtitle: '通过账户 ID 搜索好友并进行站内转账。',
        accountId: '账户 ID',
        searching: '搜索中…',
        search: '搜索',
        notFound: '未找到对应账户',
        formTitle: '转账金额',
        fee: '手续费',
        deducted: '扣减',
        submit: '转账',
        success: '已发起转账',
        tips: {
          verify: '请仔细核对收款人头像、姓名和账户 ID 再继续。',
          noFee: '站内转账免手续费。',
          otp: '提交需要谷歌验证（OTP）。',
        },
      },

      run: {
        orders: '订单',
        noOrders: '今日暂无订单。',
        address: '地址',
      },

      home: {
        complianceNote: {
          title: '合规与平台合作说明',
          points: [
            '我们严格遵循各平台服务条款与适用法律开展合作。',
            '仅协助合规的、公开推广的任务；不涉及虚假流量、操纵或滥用。',
            '数据按隐私政策处理，仅用于任务匹配与结算。',
            '如平台要求限制或下线，将立即停止相关任务。',
          ],
        },
      },

      referralsPage: {
        title: '邀请好友获得奖励',
        subtitle: '两级推广，规则清晰透明。',
        link: {
          title: '邀请链接',
          code: '邀请码',
          tip: '分享你的链接或邀请码邀请好友。',
        },
        stats: {
          firstDeposit: '一级首充奖励',
          firstDepositSub: '好友首充金额的 30%',
          today: '今日预估分成',
          todaySub: '一级 10% + 二级 5% 的今日利润',
          total: '累计奖励',
          totalSub: '所有已计入的奖励',
        },
        rules: {
          title: '奖励规则',
          level1: { title: '一级', desc: '每日利润的 10%；首充奖励 30%。' },
          level2: { title: '二级', desc: '每日利润的 5%；无首充奖励。' },
        },
        filter: {
          searchPlaceholder: '搜索姓名…',
          sort: {
            label: '排序',
            joinedDesc: '加入时间（最新）',
            firstDepositDesc: '首充金额（降序）',
            todayProfitDesc: '今日利润（降序）',
            nameAsc: '姓名（A → Z）',
          },
        },
        level1: {
          title: '一级好友',
          tip: '首充奖励仅对一级生效。',
          empty: '还没有一级好友。',
          badge: 'L1',
        },
        level2: {
          title: '二级好友',
          tip: '二级分成为今日利润的 5%。',
          empty: '还没有二级好友。',
          badge: 'L2',
        },
        perLevel: {
          l1: {
            rewardFirstTotal: '一级首充奖励合计',
            todayShare: '一级今日预估分成',
          },
        l2: {
            todayShare: '二级今日预估分成',
          },
        },
        joinedAtLabel: '加入时间',
        friend: {
          firstDeposit: '好友首充金额',
          yourFirstReward: '你的首充奖励',
          friendTodayProfit: '好友今日利润',
          yourShare: '你的分成（{{rate}}）',
          level2NoFirst: '二级无首充奖励',
        },
        emptyFiltered: '没有符合筛选条件的结果。',
      },

      // 提现页（新增）
      withdrawalsPage: {
        availableBalance: '可用余额',
        feeNote: '平台收取 1% 手续费。提取 BTC/ETH 时，目的链路可能另有矿工费。',
        selectNetworkTip: '请先选择正确的网络再填写地址。',
        destAddress: '提币地址',
        amount: '金额（{{sym}}）',
        max: '最大',
        balance: '余额：',
        amountLabel: '金额',
        fee1: '手续费（1%）',
        deducted: '扣减',
        submitting: '提交中…',
        submit: '提交提现',
        tips: {
          match: '请确保地址与所选网络一致。',
          exchangeSupport: '可在“兑换”页面在 BTC/ETH 与 USDT 之间转换。',
          minerFee: '链上矿工费视目的网络而定。',
        },
        otp: {
          title: '谷歌验证（OTP）',
          desc: '输入 6 位验证码完成验证并提交。',
          notBound: '当前账户未绑定谷歌验证。',
          first: '请先前往绑定后再继续。',
          code6: '6 位验证码',
          invalid: '请输入 6 位数字验证码',
          bindFirst: '请先绑定谷歌验证',
          verifying: '验证中…',
          verifySubmit: '验证并提交',
        },
        requested: '提现申请已提交',
        requestFailed: '申请失败',
      },
      withdrawals: {
        hints: {
          mismatch: '该地址与所选网络不匹配。',
          detectedTRC20: '检测到 Tron（TRC20）地址。',
          detectedBTC: '检测到 Bitcoin（BTC）地址。',
          detectedEVM: '检测到 EVM 0x 地址。',
          selectEVM: '请选择 ERC20/ETH/BEP20 网络。',
        },
      },
    },
  },

  // Other languages keep login basics and language names; pages use English fallback.
  hi: {
    translation: {
      appName: 'CCRC AD',
      lang: {
        en: 'English',
        zh: '简体中文',
        hi: 'हिन्दी',
        ar: 'العربية',
        es: 'Español',
        pt: 'Português',
      },
      settings: {
        language: { title: 'भाषा' },
      },
      login: {
        title: 'वापसी पर स्वागत है',
        subtitle: 'जारी रखने के लिए साइन इन करें',
        email: 'ईमेल',
        password: 'पासवर्ड',
        otp: 'गूगल सत्यापन कोड',
        otpPlaceholder: '6-अंकीय कोड',
        signIn: 'साइन इन',
        signingIn: 'साइन इन हो रहा है…',
        checking: 'खाता जाँच हो रही है…',
        success: 'साइन इन सफल',
        failed: 'साइन इन विफल',
        notice: 'GA-बाउंड डेमो हेतु jane@example.com का उपयोग करें（OTP आवश्यक）。',
        hintPassword: 'डेमो पासवर्ड: demo123',
        hintOtp: 'डेमो OTP: 123456',
        showPassword: 'पासवर्ड दिखाएँ',
        hidePassword: 'पासवर्ड छिपाएँ',
        errors: {
          required: 'यह आवश्यक है',
          invalidEmail: 'कृपया मान्य ईमेल दर्ज करें',
          otp: 'मान्य 6-अंकीय कोड दर्ज करें',
        },
      },
    },
  },

  ar: {
    translation: {
      appName: 'CCRC AD',
      lang: {
        en: 'English',
        zh: '简体中文',
        hi: 'हिन्दी',
        ar: 'العربية',
        es: 'Español',
        pt: 'Português',
      },
      settings: {
        language: { title: 'اللغة' },
      },
      login: {
        title: 'مرحباً بعودتك',
        subtitle: 'سجّل الدخول للمتابعة',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        otp: 'رمز Google Authenticator',
        otpPlaceholder: 'رمز من 6 أرقام',
        signIn: 'تسجيل الدخول',
        signingIn: 'جارٍ تسجيل الدخول…',
        checking: 'يتم التحقق من الحساب…',
        success: 'تم تسجيل الدخول',
        failed: 'فشل تسجيل الدخول',
        notice: 'استخدم jane@example.com لعرض ربط GA (OTP مطلوب).',
        hintPassword: 'كلمة المرور التجريبية: demo123',
        hintOtp: 'OTP تجريبي: 123456',
        showPassword: 'إظهار كلمة المرور',
        hidePassword: 'إخفاء كلمة المرور',
        errors: {
          required: 'هذه الخانة مطلوبة',
          invalidEmail: 'يرجى إدخال بريد صالح',
          otp: 'أدخل رمزاً مكوّناً من 6 أرقام',
        },
      },
    },
  },

  es: {
    translation: {
      appName: 'CCRC AD',
      lang: {
        en: 'English',
        zh: '简体中文',
        hi: 'हिन्दी',
        ar: 'العربية',
        es: 'Español',
        pt: 'Português',
      },
      settings: {
        language: { title: 'Idioma' },
      },
      login: {
        title: 'Bienvenido de nuevo',
        subtitle: 'Inicia sesión para continuar',
        email: 'Correo electrónico',
        password: 'Contraseña',
        otp: 'Código de Google Authenticator',
        otpPlaceholder: 'Código de 6 dígitos',
        signIn: 'Iniciar sesión',
        signingIn: 'Iniciando…',
        checking: 'Comprobando cuenta…',
        success: 'Sesión iniciada',
        failed: 'Error de inicio de sesión',
        notice: 'Usa jane@example.com para el demo con GA (requiere OTP).',
        hintPassword: 'Contraseña demo: demo123',
        hintOtp: 'OTP demo: 123456',
        showPassword: 'Mostrar contraseña',
        hidePassword: 'Ocultar contraseña',
        errors: {
          required: 'Este campo es obligatorio',
          invalidEmail: 'Ingresa un correo válido',
          otp: 'Ingresa un código válido de 6 dígitos',
        },
      },
    },
  },

  pt: {
    translation: {
      appName: 'CCRC AD',
      lang: {
        en: 'English',
        zh: '简体中文',
        hi: 'हिन्दी',
        ar: 'العربية',
        es: 'Español',
        pt: 'Português',
      },
      settings: {
        language: { title: 'Idioma' },
      },
      login: {
        title: 'Bem-vindo de volta',
        subtitle: 'Entre para continuar',
        email: 'E-mail',
        password: 'Senha',
        otp: 'Código do Google Authenticator',
        otpPlaceholder: 'Código de 6 dígitos',
        signIn: 'Entrar',
        signingIn: 'Entrando…',
        checking: 'Verificando conta…',
        success: 'Login efetuado',
        failed: 'Falha no login',
        notice: 'Use jane@example.com para o demo com GA (OTP obrigatório).',
        hintPassword: 'Senha demo: demo123',
        hintOtp: 'OTP demo: 123456',
        showPassword: 'Mostrar senha',
        hidePassword: 'Ocultar senha',
        errors: {
          required: 'Campo obrigatório',
          invalidEmail: 'Insira um e-mail válido',
          otp: 'Insira um código de 6 dígitos',
        },
      },
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

applyHtmlLangDir(i18n.language)

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('pref_lang', lng)
  } catch {}
  applyHtmlLangDir(lng)
})

export default i18n
