import { CSSProperties } from "react";
import { styled } from "styled-components";
import { OrbsLogo } from "./OrbsLogo";

export const PoweredByOrbs = ({
  className = "",
  style = {},
  labelStyles = {},
  symbolStyle = {},
}: {
  className?: string;
  style?: CSSProperties;
  labelStyles?: CSSProperties;
  symbolStyle?: CSSProperties;
}) => {
  return (
    <Container style={style} className={className}>
      <a href="https://www.orbs.com/" target="_blank" rel="noreferrer">
        <span style={labelStyles} className="title">
          Powered by
        </span>{" "}
        <span style={symbolStyle}>Orbs</span> <OrbsLogo />
      </a>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  a {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
  }
`;
