/* ==========================================================================
 * 数据区 —— 想改假数据直接动这里
 * ========================================================================== */
const DATA = {
  /* 头像已内嵌真实照片。想换人：把 img 的值改成你的图片地址；删掉 img 则退回渐变+emoji */
  me: { name: 'Hank', badge: 'Lv.242', visits: '242', avatar: { img: 'assets/avatar-me.jpg' } },

  friends: [
    { name: '小林',   avatar: { img: 'assets/avatar-xiaolin.jpg' } },
    { name: '阿哲',   avatar: { img: 'assets/avatar-azhe.jpg' } },
    { name: 'Momo',   avatar: { img: 'assets/avatar-momo.jpg' } },
    { name: '老王',   avatar: { img: 'assets/avatar-laowang.jpg' } },
    { name: 'Kevin',  avatar: { img: 'assets/avatar-kevin.jpg' } },
  ],

  topics: ['日常分享', '加班日记', '周末去哪儿', '今天吃什么', '撸猫日常', '旅行碎片'],

  locations: ['深圳 · 腾讯滨海大厦', '深圳 · 深圳湾公园', '深圳 · 大梅沙海滨公园', '广州 · 珠江新城', '杭州 · 西湖'],

  visibilities: [
    { id: 'public',  label: '所有人可见', sub: '所有人可查看这条说说' },
    { id: 'friends', label: '好友可见',   sub: '仅QQ好友可见' },
    { id: 'partial', label: '部分好友',   sub: '仅选中的好友可见' },
    { id: 'private', label: '仅自己可见', sub: '仅自己可见，别人看不到' },
  ],

  emojis: [
    '😀','😄','😂','🤣','😊','😍','😘','😜','🤔','😎','🥳','🥺',
    '😴','😭','😤','🙄','🙏','👏','👍','💪','❤️','💔','💯','🔥',
    '✨','🌈','☀️','🌙','⭐','🌸','🌹','🍉','🍇','🍜','🍰','☕',
    '🎂','🏀','🎮','📷','✈️','🚗','🏝️','🏔️','🐱','🐶','🐼','🎉',
  ],

  /* 预置说说：ph 配图已内嵌真实照片（img）；wide=true 为通栏宽图。换成你自己的图：
     ph: [{ img: '你的图片地址', wide: true }] */
  seedPosts: [
    {
      id: 's1', mine: true, time: '09:52',
      text: '新版发布器联调通过，截图留念 📸 <span class="tag">#工作日常#</span>',
      ph: [{ img: 'assets/photo-code.jpg', wide: true }],
      likes: 12, comments: 4,
    },
    {
      id: 's2', author: 'Momo', time: '07-24 10:41',
      text: '连着加了一周班，今天终于把二编辑的媒体恢复逻辑理顺了。结论：任何看起来简单的「回显」，背后都藏着一堆边界条件。深有感触的举个手 🙋',
      likes: 41, comments: 12, likers: ['小林', '阿哲'],
      commentList: [
        { name: '小林', text: '握个手！我这周也卡在回显数据对不上，太难了 😭', time: '昨天 09:12' },
        { name: '阿哲', text: '前端显示层一致性问题确实很多，深有体会。', time: '昨天 11:30' },
        { name: 'Kevin', text: '看看我们的测试用例能不能覆盖到。', time: '昨天 14:05' },
      ],
    },
    {
      id: 's3', author: '小林', time: '昨天 18:20',
      text: '周末去了趟海边，风一吹什么烦恼都没了 ☀️',
      ph: [
        { img: 'assets/photo-sea.jpg' },
        { img: 'assets/photo-beach.jpg' },
        { img: 'assets/photo-boat.jpg' },
      ],
      loc: '深圳 · 大梅沙海滨公园', likes: 23, comments: 6,
      commentList: [
        { name: 'Hank', text: '真羡慕！我也想找个周末去吹吹海风。', time: '今天 08:50' },
        { name: 'Momo', text: '是哪片海？看起来很美 ✨', time: '昨天 22:15' },
      ],
    },
    {
      id: 's4', author: 'Kevin', time: '昨天 21:04',
      text: '<span class="tag">#今天吃什么#</span> 深夜食堂第 108 天：还是牛肉面，加了个蛋 🍜',
      ph: [{ img: 'assets/photo-noodle.jpg' }],
      likes: 5, comments: 2,
      commentList: [
        { name: '老王', text: '这碗面看着也太香了吧 🍜', time: '昨天 22:10' },
      ],
    },
    {
      id: 's5', author: '阿哲', time: '07-23 22:10',
      text: '晚霞镇楼，原图直出，不谢 🌆',
      ph: [{ img: 'assets/photo-sunset.jpg', wide: true }],
      likes: 67, comments: 9, likers: ['Momo', '老王', '小林'],
    },
    {
      id: 's6', author: '老王', time: '3分钟前', text: '猫片治愈一切。',
      ph: [{ img: 'assets/photo-cat.jpg' }],
      likes: 8, comments: 1,
    },
  ],
};
