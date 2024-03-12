import React, { useEffect, useMemo, useRef, useState } from "react";
import { Panoview, ViewEventType } from "./Panoview";
import { Engine } from "./Engine";

export const App = () => {
    const canvasRef = useRef();
    // const [pendingMove, setPendingMove] = useState(false)
    const threeInstance = useMemo(() => new Engine(), [])
    const panoviewInstance = useMemo(() => new Panoview(threeInstance), [])
    const moveStartRef = useRef({ x: 0, y: 0 });    // horizontal, vertical
    const pendingMoveRef = useRef(false)
    useEffect(() => {
        threeInstance.init(canvasRef.current);
        panoviewInstance.init();
        threeInstance.render();
    });
    const handleMouseMove = (evt, evtType) => {
        let view
        switch (evtType) {
            case ViewEventType.MOVE_START:
                moveStartRef.current.x = evt.clientX
                moveStartRef.current.y = evt.clientY
                pendingMoveRef.current = true
                console.log(`START move`)
                break;
            case ViewEventType.MOVE:
                if (pendingMoveRef.current) {
                    console.log(`pendingMove: ${pendingMoveRef.current}`)
                    view = {
                        x: moveStartRef.current.x - evt.clientX,
                        y: evt.clientY - moveStartRef.current.y,
                    }
                    panoviewInstance.onViewEvt(view)
                }
                break;
            case ViewEventType.MOVE_STOP:
                pendingMoveRef.current = false
                view = {
                    x: moveStartRef.current.x - evt.clientX,
                    y: evt.clientY - moveStartRef.current.y,
                }
                panoviewInstance.onViewEvt(view, evtType)
                console.log(`STOP move`)
                break;
            case ViewEventType.ZOOM:
                view = {
                    zoom: evt.deltaY
                }
                panoviewInstance.onViewEvt(view, evtType)
                break;
            case ViewEventType.ADD_COMMENT:
                console.log(evt)
                view = {
                    pos: evt
                }
                panoviewInstance.onViewEvt(view, evtType)
                break;
        }
    }

    return (
        <div id="panoview"
            onMouseDown={(evt) => handleMouseMove(evt, ViewEventType.MOVE_START)}
            onMouseMove={(evt) => handleMouseMove(evt, ViewEventType.MOVE)}
            onMouseUp={(evt) => handleMouseMove(evt, ViewEventType.MOVE_STOP)}
            onWheel={(evt) => handleMouseMove(evt, ViewEventType.ZOOM)}
            onKeyDown={(evt) => handleMouseMove(evt, ViewEventType.ADD_COMMENT)}>
            <canvas ref={canvasRef} id="panoview"></canvas>
        </div>
    );
};