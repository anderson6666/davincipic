import { motion } from 'framer-motion';

const TAGS = [
  { label: '提亮画面', prompt: '把画面提亮一些' },
  { label: '增加暖色调', prompt: '增加温暖的色调' },
  { label: '电影感', prompt: '套用电影感的LUT' },
  { label: '降噪', prompt: '对图像进行降噪处理' },
  { label: 'S曲线', prompt: '用曲线增加对比度' },
  { label: '冷色调', prompt: '调整为清冷的蓝色调' },
  { label: '复古', prompt: '应用复古怀旧滤镜' },
  { label: '黑白', prompt: '转换为黑白照片' },
];

interface Props {
  onClick?: (prompt: string) => void;
}

export default function QuickTags({ onClick }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TAGS.map((tag, index) => (
        <motion.button
          key={tag.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{
            borderColor: '#00d4ff',
            color: '#00d4ff',
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onClick?.(tag.prompt)}
          className="rounded-full border border-studio-border bg-studio-surface px-3 py-1.5 font-sans text-xs text-studio-text-dim transition-colors hover:border-studio-accent hover:text-studio-accent"
        >
          {tag.label}
        </motion.button>
      ))}
    </div>
  );
}
