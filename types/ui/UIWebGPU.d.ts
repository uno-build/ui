export default class UIWebGPU extends UI {
    static create(options: any): Promise<{
        ui: UIWebGPU;
    }>;
    dispatchPlatformEvent(source_event: any): void;
}
import UI from '../core/UI';
