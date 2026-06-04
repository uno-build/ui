export default function createNestedMarginsLayout({ ui, rendererName }) {
    const stage = ui.create({
        flex: '1',
        flexDirection: 'row',
        padding: '40px',
        gap: '32px',
    })
    ui.root.add(stage)

    const stack = ui.create({
        width: '260px',
        height: '220px',
        flexDirection: 'column',
        padding: '16px',
        borderTopWidth: '2px',
        borderLeftWidth: '2px',
        borderRightWidth: '2px',
        borderBottomWidth: '2px',
        borderTopStyle: 'solid',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderTopColor: '#464',
        borderLeftColor: '#464',
        borderRightColor: '#464',
        borderBottomColor: '#464',
        backgroundColor: '#eef7ee',
    })
    stage.add(stack)

    stack.add(
        ui.create({
            width: '120px',
            height: '34px',
            backgroundColor: '#d3e7d3',
        }),
    )

    const marginParent = ui.create({
        width: '160px',
        height: '120px',
        marginTop: '17px',
        marginLeft: '23px',
        padding: '14px',
        borderTopWidth: '2px',
        borderLeftWidth: '2px',
        borderRightWidth: '2px',
        borderBottomWidth: '2px',
        borderTopStyle: 'solid',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderTopColor: '#595',
        borderLeftColor: '#595',
        borderRightColor: '#595',
        borderBottomColor: '#595',
        backgroundColor: '#dff0df',
    })
    stack.add(marginParent)

    const marginChild = ui.create({
        width: '96px',
        height: '64px',
        marginTop: '11px',
        marginLeft: '9px',
        padding: '8px',
        borderTopWidth: '2px',
        borderLeftWidth: '2px',
        borderRightWidth: '2px',
        borderBottomWidth: '2px',
        borderTopStyle: 'solid',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderTopColor: '#696',
        borderLeftColor: '#696',
        borderRightColor: '#696',
        borderBottomColor: '#696',
        backgroundColor: '#c9e6c9',
    })
    marginParent.add(marginChild)

    const nestedMarginMarker = ui.create({
        width: '18px',
        height: '18px',
        backgroundColor: '#008800',
    })
    marginChild.add(nestedMarginMarker)

    const rowHost = ui.create({
        width: '300px',
        height: '120px',
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: '12px',
        borderTopWidth: '2px',
        borderLeftWidth: '2px',
        borderRightWidth: '2px',
        borderBottomWidth: '2px',
        borderTopStyle: 'solid',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderTopColor: '#745',
        borderLeftColor: '#745',
        borderRightColor: '#745',
        borderBottomColor: '#745',
        backgroundColor: '#f8edf2',
    })
    stage.add(rowHost)

    rowHost.add(
        ui.create({
            width: '56px',
            height: '40px',
            marginTop: '15px',
            marginLeft: '19px',
            marginRight: '27px',
            backgroundColor: '#ebccd8',
        }),
    )

    const afterMarginMarker = ui.create({
        width: '22px',
        height: '22px',
        marginTop: '21px',
        backgroundColor: '#cc3366',
    })
    rowHost.add(afterMarginMarker)

    const endAlignedMarginHost = ui.create({
        width: '90px',
        height: '150px',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: '12px',
        borderTopWidth: '2px',
        borderLeftWidth: '2px',
        borderRightWidth: '2px',
        borderBottomWidth: '2px',
        borderTopStyle: 'solid',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderTopColor: '#764',
        borderLeftColor: '#764',
        borderRightColor: '#764',
        borderBottomColor: '#764',
        backgroundColor: '#fff0df',
    })
    stage.add(endAlignedMarginHost)

    endAlignedMarginHost.add(
        ui.create({
            width: '52px',
            height: '30px',
            backgroundColor: '#f3d2b0',
        }),
    )

    const endAlignedMarginMarker = ui.create({
        width: '24px',
        height: '24px',
        marginTop: '13px',
        marginLeft: '17px',
        marginRight: '19px',
        backgroundColor: '#dd7700',
    })
    endAlignedMarginHost.add(endAlignedMarginMarker)
}
