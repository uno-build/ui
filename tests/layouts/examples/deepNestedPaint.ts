export default function createDeepNestedPaintLayout({ ui, rendererName }) {
    console.log(`--- ${rendererName} ---`)

    const shell = ui.create({
        flex: '1',
        flexDirection: 'column',
        padding: '24px',
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: '#222',
        gap: '12px',
        backgroundColor: '#f4f4f4',
    })
    ui.root.add(shell)

    const header = ui.create({
        height: '44px',
        backgroundColor: '#d8e8ff',
    })
    shell.add(header)

    const row = ui.create({
        height: '420px',
        flexDirection: 'row',
        padding: '13px',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#446',
        gap: '17px',
        alignItems: 'center',
        backgroundColor: '#eef5ee',
    })
    shell.add(row)

    row.add(
        ui.create({
            width: '92px',
            height: '146px',
            backgroundColor: '#f0d8d8',
        }),
    )

    const shiftedColumn = ui.create({
        flex: '1',
        height: '320px',
        position: 'relative',
        left: '11px',
        top: '7px',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: '19px',
        borderWidth: '4px',
        borderStyle: 'solid',
        borderColor: '#484',
        gap: '15px',
        backgroundColor: '#fff8df',
    })
    row.add(shiftedColumn)

    shiftedColumn.add(
        ui.create({
            width: '88px',
            height: '36px',
            backgroundColor: '#dfdfdf',
        }),
    )

    const nestedRow = ui.create({
        width: '468px',
        height: '190px',
        position: 'relative',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '11px',
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: '#884',
        gap: '9px',
        backgroundColor: '#f8eaff',
    })
    shiftedColumn.add(nestedRow)

    const flowStack = ui.create({
        width: '124px',
        height: '132px',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        padding: '7px',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#855',
        gap: '6px',
        backgroundColor: '#ffe8e8',
    })
    nestedRow.add(flowStack)

    flowStack.add(
        ui.create({
            width: '42px',
            height: '28px',
            backgroundColor: '#f2caca',
        }),
    )

    const flowMarker = ui.create({
        width: '20px',
        height: '20px',
        backgroundColor: '#ff0000',
    })
    flowStack.add(flowMarker)

    const alignedHost = ui.create({
        width: '148px',
        height: '132px',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: '8px',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#585',
        backgroundColor: '#eaffea',
    })
    nestedRow.add(alignedHost)

    const alignedMarker = ui.create({
        width: '24px',
        height: '18px',
        backgroundColor: '#00aa00',
    })
    alignedHost.add(alignedMarker)

    const absoluteHost = ui.create({
        width: '138px',
        height: '132px',
        position: 'relative',
        flexDirection: 'column',
        padding: '10px',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#558',
        backgroundColor: '#e8eaff',
    })
    nestedRow.add(absoluteHost)

    absoluteHost.add(
        ui.create({
            width: '52px',
            height: '34px',
            backgroundColor: '#cacaf2',
        }),
    )

    const absoluteMarker = ui.create({
        width: '22px',
        height: '22px',
        position: 'absolute',
        right: '13px',
        bottom: '9px',
        backgroundColor: '#0000ff',
    })
    absoluteHost.add(absoluteMarker)

    return {
        markers: {
            flowMarker,
            alignedMarker,
            absoluteMarker,
        },
    }
}
