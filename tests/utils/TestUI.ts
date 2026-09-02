import UI from '../../src/core/UI'

export default class TestUI extends UI {
    public static async create(options) {
        const ui = new TestUI(options)
        await ui.initialize()
        return ui
    }

    public dispatchPlatformEvent(source_event, event_data) {
        this.emitPlatformEvent(source_event, event_data)
    }
}
