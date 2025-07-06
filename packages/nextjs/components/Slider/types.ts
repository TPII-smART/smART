export interface SliderProps {
  /**
   * Callback function triggered when the slider value changes.
   */
  onChange?: (value: number) => void;
  /**
   * Minimum value of the slider.
   * Defaults to 0.
   */
  min?: number;
  /**
   * Maximum value of the slider.
   * Defaults to 1.
   */
  max?: number;
  /**
   * Default value of the slider when it is first rendered.
   * Defaults to 0.
   */
  defaultValue?: number;
}
