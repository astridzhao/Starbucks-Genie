// = Page.tsx in the example
import styled from "styled-components";
import React from "react";
import { useCrewJob } from "../hooks/useCrewJob";
import InputSection from "./customizePage/InputSection";
import EventLog from "./customizePage/EventLog";
import FinalOutput from "./customizePage/finalOutput";
import { FaLightbulb } from "react-icons/fa";

const PageContainer = styled.div`
  padding: 0;
`;

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const InputColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const OutputColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
`;

const GenerateButton = styled.button`
  background-color: #006241;
  color: white;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border-radius: 0.25rem;
  width: fit-content;
  font-family: "Menlo";
  &:hover {
    background-color: #1e3932;
  }
`;

const InspirationButton = styled(GenerateButton)`
  background-color: #d4e9e2;
  color: #006241;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Menlo";

  &:hover {
    background-color: #b8dcce;
  }
`;

const DrinkCustomizer = () => {
  const crewJob = useCrewJob();

  const handleInspiration = () => {
    crewJob.setUserInput([]);
    crewJob.setUserPreference([]);
    crewJob.startJob({ input: [], preference: [] });
  };

  return (
    <PageContainer>
      <h2>Ask the Genie</h2>
      <p>
        Describe your craving for an AI recipe. Nutrition is calculated only in
        the ingredient builder above.
      </p>
      <TwoColumnLayout>
        <InputColumn>
          <InputSection
            title="Make a Wish"
            placeholder="e.g. an iced coffee with caramel notes"
            data={crewJob.userInput}
            setData={crewJob.setUserInput}
          />
          <InputSection
            title="Tell me your personal preference"
            placeholder="What you like or dislike"
            data={crewJob.userPreference}
            setData={crewJob.setUserPreference}
          />
          <ButtonContainer>
            <GenerateButton
              onClick={() => crewJob.startJob()}
              disabled={crewJob.running}
            >
              {crewJob.running ? "Creating..." : "Generate"}
            </GenerateButton>
            <InspirationButton
              onClick={handleInspiration}
              disabled={crewJob.running}
            >
              <FaLightbulb /> Surprise Me
            </InspirationButton>
          </ButtonContainer>
        </InputColumn>
        <OutputColumn>
          <FinalOutput drinkInfoList={crewJob.drinkInfo} />
          <EventLog events={crewJob.events} />
        </OutputColumn>
      </TwoColumnLayout>
    </PageContainer>
  );
};

export default DrinkCustomizer;
