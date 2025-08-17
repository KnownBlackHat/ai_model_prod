import Spline from '@splinetool/react-spline';
import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import BgVideo from "./assets/bg5.mp4";
import React, { useState } from "react";
import { useGLTF } from "@react-three/drei";
// https://prod.spline.design/SPIIV5uOhPCNalYB/scene.splinecode
// https://prod.spline.design/TJ95vhU6CBg7fNbH/scene.splinecode
// https://prod.spline.design/tThMznD1kxf94Avq/scene.splinecode
// https://prod.spline.design/l54auptMlsPAQma5/scene.splinecode
function App() {
    const { animations } = useGLTF("/models/animations.glb");
    const [animation, setAnimation] = useState(
        animations.find((a) => a.name === "Idle") ? "Idle" : animations[0].name
    );
    const [facialExpression, setFacialExpression] = useState("");

    const meta_ui = { animations, animation, setAnimation, facialExpression, setFacialExpression };

    return (
        <>
            <Spline
                // scene="https://prod.spline.design/SPIIV5uOhPCNalYB/scene.splinecode"
                // scene="https://prod.spline.design/TJ95vhU6CBg7fNbH/scene.splinecode"
                // scene="https://prod.spline.design/tThMznD1kxf94Avq/scene.splinecode"
                scene="https://prod.spline.design/l54auptMlsPAQma5/scene.splinecode"
                className="absolute object-cover w-full h-full bg-black"
            />


            <Loader hidden />
            <Leva hidden />
            <UI meta_ui={meta_ui} />
            <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
                <Experience meta_ui={meta_ui} />
            </Canvas>
        </>
    );
}

export default App;
