// = Page.tsx in the example
import styled from 'styled-components';
import React, { useEffect } from 'react';
import { useCrewJob } from '../hooks/useCrewJob';
import InputSection from './customizePage/InputSection';
import EventLog from './customizePage/EventLog';
import FinalOutput from './customizePage/finalOutput';
import { FaLightbulb } from 'react-icons/fa';

const PageContainer = styled.div`
    padding: 2rem;
`;

const TwoColumnLayout = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
    margin-right: 5rem;
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
    font-family:'Menlo';
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
    font-family:'Menlo';

    &:hover {
        background-color: #b8dcce;
    }
`;

const DrinkCustomizer = () => {
    const crewJob = useCrewJob();

    useEffect(() => {
        console.log('Current User Input:', crewJob.userInput);
    }, [crewJob.userInput]);

    useEffect(() => {
        console.log('Current User Preference:', crewJob.userPreference);
    }, [crewJob.userPreference]);

    const handleInspiration = () => {
        crewJob.setUserInput([]);
        crewJob.setUserPreference([]);
        crewJob.startJob();
    };

    return (
        <PageContainer>
            <TwoColumnLayout>
                <InputColumn>
                    <InputSection
                        title="Make a Wish"
                        placeholder="What do u want in your drink"
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