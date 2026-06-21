import { AnimatePresence, motion } from 'framer-motion';
import { useNodeStore } from '../../store/useNodeStore';
import { NODE_TYPE_CONFIG, type NodeType } from '../../types';

interface AddNodeMenuProps {
  open: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

const GROUPS = [
  {
    label: '🟢 基础校正',
    types: ['primary', 'colorWheel', 'curves'] as NodeType[],
  },
  {
    label: '🟣 二级调整',
    types: ['secondary', 'qualifier', 'powerWindow', 'tracking'] as NodeType[],
  },
  {
    label: '🔵 效果处理',
    types: ['rgbMixer', 'lut', 'colorMatch', 'noiseReduce'] as NodeType[],
  },
];

export function AddNodeMenu({ open, onClose, position }: AddNodeMenuProps) {
  const addNode = useNodeStore((s) => s.addNode);

  const handleAdd = (type: NodeType) => {
    addNode(type);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="add-node-menu"
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y + 30,
            zIndex: 1000,
            background: '#1e1e1e',
            borderRadius: 8,
            border: '1px solid #333',
            padding: 8,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {GROUPS.map((group) => (
            <div key={group.label}>
              <div style={{ fontSize: 11, color: '#888', padding: '6px 8px 4px', fontWeight: 600 }}>
                {group.label}
              </div>
              {group.types.map((type) => {
                const config = NODE_TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleAdd(type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '7px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      color: '#ddd',
                      cursor: 'pointer',
                      fontSize: 13,
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: config.color,
                        flexShrink: 0,
                      }}
                    />
                    {config.label}
                  </button>
                );
              })}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AddNodeMenu;
