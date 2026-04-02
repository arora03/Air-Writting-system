import { useState } from "react";

import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import IntegratedHero from "@/components/IntegratedHero";
import LiveSystem from "@/components/LiveSystem";
import PredictionInsights from "@/components/PredictionInsights";
import RecognitionOutput from "@/components/RecognitionOutput";
import RuntimeSettings from "@/components/RuntimeSettings";
import SystemOverview from "@/components/SystemOverview";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSection from "@/components/FeaturesSection";
import SiteFooter from "@/components/SiteFooter";
import { useAirWriting } from "@/hooks/use-air-writing";

const Index = () => {
  const [recognizedText, setRecognizedText] = useState("");
  const {
    status,
    loading,
    error,
    activeAction,
    streamUrl,
    startCamera,
    stopCamera,
    clearCanvas,
    predictNow,
    updateSettings,
  } = useAirWriting();

  const prediction = status?.prediction ?? null;
  const canAppendPrediction = Boolean(prediction);

  const appendPrediction = () => {
    if (!prediction) {
      return;
    }

    setRecognizedText((current) => `${current}${prediction.label}`);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <ParticleBackground />
      <Navbar />
      <IntegratedHero status={status} loading={loading} />
      <LiveSystem
        status={status}
        loading={loading}
        error={error}
        activeAction={activeAction}
        streamUrl={streamUrl}
        onStartCamera={startCamera}
        onStopCamera={stopCamera}
        onClearCanvas={clearCanvas}
        onPredict={predictNow}
      />
      <SystemOverview status={status} error={error} />
      <PredictionInsights prediction={prediction} onAppendPrediction={appendPrediction} />
      <RecognitionOutput
        text={recognizedText}
        setText={setRecognizedText}
        onAppendPrediction={appendPrediction}
        canAppendPrediction={canAppendPrediction}
      />
      <RuntimeSettings status={status} activeAction={activeAction} onUpdateSettings={updateSettings} />
      <HowItWorks />
      <FeaturesSection />
      <SiteFooter />
    </div>
  );
};

export default Index;
