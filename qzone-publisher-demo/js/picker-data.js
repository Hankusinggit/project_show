/* ==========================================================================
 * 选图器预制数据：100 张照片 + 10 个视频
 * ========================================================================== */

/* 100 张照片（assets/picker/p_001.jpg ~ p_100.jpg） */
const PICKER_PHOTOS = Array.from({ length: 100 }, (_, i) =>
  'assets/picker/p_' + String(i + 1).padStart(3, '0') + '.jpg'
);

/* 10 个视频（assets/picker/v_01.mp4 ~ v_10.mp4）
   cover 用照片库的图当封面，duration 单位秒 */
const PICKER_VIDEOS = [
  { src: 'assets/picker/v_01.mp4', cover: 'assets/picker/p_020.jpg', duration: 10 },
  { src: 'assets/picker/v_02.mp4', cover: 'assets/picker/p_023.jpg', duration: 10 },
  { src: 'assets/picker/v_03.mp4', cover: 'assets/picker/p_027.jpg', duration: 10 },
  { src: 'assets/picker/v_04.mp4', cover: 'assets/picker/p_033.jpg', duration: 10 },
  { src: 'assets/picker/v_05.mp4', cover: 'assets/picker/p_044.jpg', duration: 10 },
  { src: 'assets/picker/v_06.mp4', cover: 'assets/picker/p_055.jpg', duration: 10 },
  { src: 'assets/picker/v_07.mp4', cover: 'assets/picker/p_066.jpg', duration: 10 },
  { src: 'assets/picker/v_08.mp4', cover: 'assets/picker/p_077.jpg', duration: 10 },
  { src: 'assets/picker/v_09.mp4', cover: 'assets/picker/p_088.jpg', duration: 10 },
  { src: 'assets/picker/v_10.mp4', cover: 'assets/picker/p_099.jpg', duration: 9 },
];
