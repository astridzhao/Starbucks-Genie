import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const Title = styled.h2`
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 1rem;
    font-family:'Menlo';
`;

const LogContainer = styled.div`
    flex-grow: 1;
    overflow: auto;
    border: 2px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 1rem;
    min-height: 200px;
    max-height: 400px;
`;

const EventItem = styled.div`
    margin-bottom: 0.5rem;
`;

const Timestamp = styled.span`
    color: #6b7280;
    margin-right: 0.5rem;
`;

const EmptyMessage = styled.div`
    color: #9ca3af;
`;

const EventLog = ({ events }) => {
    return (
        <Container>
            <Title>Event Log</Title>
            <LogContainer>
                {(!events || events.length === 0) ? (
                    <EmptyMessage>No events yet...</EmptyMessage>
                ) : (
                    events.map((event, index) => (
                        <EventItem key={index}>
                            <Timestamp>{event.timestamp}:</Timestamp>
                            <span>{event.data}</span>
                        </EventItem>
                    ))
                )}
            </LogContainer>
        </Container>
    );
};

export default EventLog;