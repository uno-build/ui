export default function createNestedPercentDimensionsLayout({
    ui,
    rendererName,
}) {
    const stage = ui.create({
        flex: '1',
        padding: '40px',
    })
    ui.root.add(stage)

    const frame = ui.create({
        width: '360px',
        height: '260px',
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: '20px',
        borderTopWidth: '4px',
        borderLeftWidth: '4px',
        borderRightWidth: '4px',
        borderBottomWidth: '4px',
        borderTopStyle: 'solid',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderTopColor: '#345',
        borderLeftColor: '#345',
        borderRightColor: '#345',
        borderBottomColor: '#345',
        gap: '16px',
        backgroundColor: '#eef1f8',
    })
    stage.add(frame)

    const percentHost = ui.create({
        width: '60%',
        height: '70%',
        flexDirection: 'column',
        padding: '12px',
        borderTopWidth: '2px',
        borderLeftWidth: '2px',
        borderRightWidth: '2px',
        borderBottomWidth: '2px',
        borderTopStyle: 'solid',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderTopColor: '#467',
        borderLeftColor: '#467',
        borderRightColor: '#467',
        borderBottomColor: '#467',
        backgroundColor: '#d9e7ff',
    })
    frame.add(percentHost)

    const percentSizeMarker = ui.create({
        width: '50%',
        height: '40%',
        backgroundColor: '#1166dd',
    })
    percentHost.add(percentSizeMarker)

    const endAlignedPercentHost = ui.create({
        width: '80%',
        height: '50%',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: '8px',
        borderTopWidth: '2px',
        borderLeftWidth: '2px',
        borderRightWidth: '2px',
        borderBottomWidth: '2px',
        borderTopStyle: 'solid',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderTopColor: '#358',
        borderLeftColor: '#358',
        borderRightColor: '#358',
        borderBottomColor: '#358',
        backgroundColor: '#c8dcff',
    })
    percentHost.add(endAlignedPercentHost)

    const endAlignedPercentMarker = ui.create({
        width: '35%',
        height: '30%',
        backgroundColor: '#003c99',
    })
    endAlignedPercentHost.add(endAlignedPercentMarker)

    const absoluteHost = ui.create({
        width: '120px',
        height: '140px',
        position: 'relative',
        padding: '10px',
        borderTopWidth: '2px',
        borderLeftWidth: '2px',
        borderRightWidth: '2px',
        borderBottomWidth: '2px',
        borderTopStyle: 'solid',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderTopColor: '#975',
        borderLeftColor: '#975',
        borderRightColor: '#975',
        borderBottomColor: '#975',
        backgroundColor: '#fde9d5',
    })
    frame.add(absoluteHost)

    const percentOffsetMarker = ui.create({
        width: '30px',
        height: '24px',
        position: 'absolute',
        left: '25%',
        top: '20%',
        backgroundColor: '#ff6b00',
    })
    absoluteHost.add(percentOffsetMarker)
}
