"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useClickAway } from "@hooks/use-click-away";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Button from "~~/components/Button/Button";

interface Option {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const IconWrapper = ({
  icon: Icon,
  isHovered,
  color,
}: {
  icon: React.ElementType;
  isHovered: boolean;
  color: string;
}) => (
  <motion.div
    className="w-4 h-4 mr-2 relative flex items-center justify-center"
    initial={false}
    animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
  >
    <Icon className="w-4 h-4" />
    {isHovered && (
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ color }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <Icon className="w-4 h-4" strokeWidth={2} />
      </motion.div>
    )}
  </motion.div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export interface DropMenuProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
}
/** 
  @deprecated "DropMenu is deprecated, please use the new ComboBox  component instead. -@/components/Combobox"
*/
export default function DropMenu({ options, value, onChange }: DropMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<Option>(
    options.find(option => option.id === value) || options[0],
  );
  const [hoveredOption, setHoveredOption] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useClickAway(dropdownRef as React.RefObject<HTMLElement>, () => setIsOpen(false));

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleOptionChange = (option: Option) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (onChange) {
      onChange(option.id);
    }
  };

  return (
    <MotionConfig>
      <div className="flex flex-row items-center justify-center min-h-0">
        <div
          className="w-full px-4 relative"
          style={{
            maxWidth: "calc(24rem - 40px)",
            height: "40px",
            zIndex: isOpen ? 50 : 10,
          }}
          ref={dropdownRef}
        >
          <Button
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full justify-between bg-[var(--color-secondary)] text-[var(--color-secondary-content)]",
              "hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-content)]",
              "focus:ring-2 focus:border-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface)]",
              "transition-all duration-100 ease-in-out",
              "border border-transparent focus:border-[var(--color-accent)]",
              "h-10 flex items-center", // Added flex items-center for vertical centering
              isOpen && "bg-neutral-800 text-neutral-200",
            )}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "40px",
              padding: "0 1rem",
            }}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <span className="flex items-center flex-1" style={{ display: "flex", alignItems: "center" }}>
              <IconWrapper icon={selectedOption.icon} isHovered={false} color={selectedOption.color} />
              <span style={{ lineHeight: "1" }}>{selectedOption.label}</span>
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              whileHover={{ rotate: isOpen ? 180 : 180 }}
              transition={{ duration: 0.2 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                marginLeft: "0.5rem",
              }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </Button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 1, y: 0, height: 0 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  height: "auto",
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 1,
                  },
                }}
                exit={{
                  opacity: 0,
                  y: 0,
                  height: 0,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 1,
                  },
                }}
                className="absolute left-4 right-4 top-full mt-2"
                onKeyDown={handleKeyDown}
              >
                <motion.div
                  className={cn(
                    "absolute w-full rounded-lg border border-[var(--color-secondary)]",
                    "bg-[var(--color-secondary)] p-1 shadow-lg",
                  )}
                  style={{
                    transformOrigin: "top",
                    zIndex: 100,
                  }}
                  initial={{ borderRadius: 8 }}
                  animate={{
                    borderRadius: 12,
                    transition: { duration: 0.1 },
                  }}
                >
                  <motion.div className="py-2 relative" variants={containerVariants} initial="hidden" animate="visible">
                    <motion.div
                      layoutId="hover-highlight"
                      className="absolute bg-[var(--color-primary)] rounded-md"
                      style={{
                        left: "4px",
                        right: "4px",
                      }}
                      animate={{
                        y:
                          options.findIndex(c => (hoveredOption || selectedOption.id) === c.id) * 40 +
                          (options.findIndex(c => (hoveredOption || selectedOption.id) === c.id) > 0 ? 20 : 0),
                        height: 40,
                      }}
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.1,
                      }}
                    />
                    {options.map((option, index) => (
                      <React.Fragment key={option.id}>
                        {index === 1 && (
                          <motion.div className="mx-4 my-2.5 border-t border-neutral-700" variants={itemVariants} />
                        )}
                        <motion.button
                          onClick={() => {
                            handleOptionChange(option);
                          }}
                          onHoverStart={() => setHoveredOption(option.id)}
                          onHoverEnd={() => setHoveredOption(null)}
                          className={cn(
                            "relative flex w-full items-center rounded-md",
                            "transition-colors duration-150",
                            "focus:outline-none",
                            selectedOption.id === option.id || hoveredOption === option.id
                              ? "text-[var(--color-primary-content)]"
                              : "text-[var(--color-secondary-content)]",
                          )}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "10px 16px",
                            margin: "0 4px",
                            height: "40px",
                          }}
                          whileTap={{ scale: 0.98 }}
                          variants={itemVariants}
                        >
                          <IconWrapper
                            icon={option.icon}
                            isHovered={hoveredOption === option.id}
                            color={option.color}
                          />
                          <span style={{ lineHeight: "1" }}>{option.label}</span>
                        </motion.button>
                      </React.Fragment>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}
