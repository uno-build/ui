export namespace EVENT {
    namespace POINTERDOWN {
        let platform: true;
        let name: "pointerdown";
        let prop: "onPointerDown";
        let priority: "discrete";
    }
    namespace POINTERMOVE {
        let platform_1: true;
        export { platform_1 as platform };
        let name_1: "pointermove";
        export { name_1 as name };
        let prop_1: "onPointerMove";
        export { prop_1 as prop };
        let priority_1: "continuous";
        export { priority_1 as priority };
    }
    namespace POINTERUP {
        let platform_2: true;
        export { platform_2 as platform };
        let name_2: "pointerup";
        export { name_2 as name };
        let prop_2: "onPointerUp";
        export { prop_2 as prop };
        let priority_2: "discrete";
        export { priority_2 as priority };
    }
    namespace POINTERCANCEL {
        let platform_3: true;
        export { platform_3 as platform };
        let name_3: "pointercancel";
        export { name_3 as name };
        let prop_3: "onPointerCancel";
        export { prop_3 as prop };
        let priority_3: "discrete";
        export { priority_3 as priority };
    }
    namespace POINTEROVER {
        let platform_4: false;
        export { platform_4 as platform };
        let name_4: "pointerover";
        export { name_4 as name };
        let prop_4: "onPointerOver";
        export { prop_4 as prop };
        let priority_4: "continuous";
        export { priority_4 as priority };
    }
    namespace POINTEROUT {
        let platform_5: false;
        export { platform_5 as platform };
        let name_5: "pointerout";
        export { name_5 as name };
        let prop_5: "onPointerOut";
        export { prop_5 as prop };
        let priority_5: "continuous";
        export { priority_5 as priority };
    }
    namespace CLICK {
        let platform_6: false;
        export { platform_6 as platform };
        let name_6: "click";
        export { name_6 as name };
        let prop_6: "onClick";
        export { prop_6 as prop };
        let priority_6: "discrete";
        export { priority_6 as priority };
    }
    namespace WHEEL {
        let platform_7: true;
        export { platform_7 as platform };
        let name_7: "wheel";
        export { name_7 as name };
        let prop_7: "onWheel";
        export { prop_7 as prop };
        let priority_7: "continuous";
        export { priority_7 as priority };
    }
    namespace SCROLL {
        let platform_8: false;
        export { platform_8 as platform };
        let name_8: "scroll";
        export { name_8 as name };
        let prop_8: "onScroll";
        export { prop_8 as prop };
        let priority_8: "continuous";
        export { priority_8 as priority };
    }
    namespace FOCUS {
        let platform_9: false;
        export { platform_9 as platform };
        let name_9: "focus";
        export { name_9 as name };
        let prop_9: "onFocus";
        export { prop_9 as prop };
        let priority_9: "discrete";
        export { priority_9 as priority };
    }
    namespace BLUR {
        let platform_10: false;
        export { platform_10 as platform };
        let name_10: "blur";
        export { name_10 as name };
        let prop_10: "onBlur";
        export { prop_10 as prop };
        let priority_10: "discrete";
        export { priority_10 as priority };
    }
}
export const PLATFORM_EVENT_NAMES: any[];
