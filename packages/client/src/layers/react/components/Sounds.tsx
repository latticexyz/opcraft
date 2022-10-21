import { Engine } from "@babylonjs/core";
import React, { useState } from "react";
import styled from "styled-components";

const MAX_VOLUME = 1;

export const Sounds: React.FC<{ playRandomTheme: () => void; playNextTheme: () => void }> = ({
  playRandomTheme,
  playNextTheme,
}) => {
  const [prevVolume, setPrevVolume] = useState(0);
  const [volume, _setVolume] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);

  function setVolume(vol: number) {
    const audioEngine = Engine.audioEngine;
    if (!audioEngine) return;
    const newVolume = Math.max(Math.min(vol, MAX_VOLUME), 0);
    audioEngine.setGlobalVolume(newVolume);
    _setVolume(newVolume);
  }

  function toggleSound() {
    const audioEngine = Engine.audioEngine;
    if (!audioEngine) return;

    if (!unlocked) {
      setUnlocked(true);
      playRandomTheme();
      audioEngine.unlock();
      setVolume(0.1);
      return;
    }

    const currentVolume = audioEngine.getGlobalVolume();
    if (currentVolume === 0 && prevVolume === 0) setVolume(0.1);
    else setVolume(prevVolume);
    setPrevVolume(currentVolume);
  }

  return (
    <>
      <Container>
        <VolumeRow onMouseEnter={() => setShowAdditional(true)} onMouseLeave={() => setShowAdditional(false)}>
          <Button onClick={toggleSound} icon={volume > 0 ? "volume-2" : "volume-x"} />
          {showAdditional && (
            <>
              <Button onClick={() => setVolume(volume - 0.1)} icon={"volume-minus"} />
              <Button onClick={() => setVolume(volume + 0.1)} icon={"volume-plus"} />
            </>
          )}
        </VolumeRow>
        <Button onClick={playNextTheme} icon={"next"} />
      </Container>
    </>
  );
};

const Button = styled.div<{ icon: string }>`
  background-color: rgb(0 0 0 / 30%);
  height: 20px;
  width: 20px;
  background-size: contain;
  background-position: center;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
  transition: all 200ms ease;
  background-image: url(/ui/${(p) => p.icon}.svg);

  :hover {
    background-color: rgb(0 0 0 / 70%);
  }

  :active {
    background-color: rgb(255 255 255 / 10%);
  }
`;

const Container = styled.div`
  pointer-events: all;
  display: grid;
  grid-gap: 3px;
`;

const VolumeRow = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 3px;
`;
