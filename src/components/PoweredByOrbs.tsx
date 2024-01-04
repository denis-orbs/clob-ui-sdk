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
    <StyledLink
      style={style}
      className={className}
      href="https://www.orbs.com/"
      target="_blank"
      rel="noreferrer"
    >
      <span style={labelStyles} className="title">
        Powered by
      </span>{" "}
      <span style={symbolStyle}>Orbs</span> <OrbsLogo />
    </StyledLink>
  );
};

const StyledLink = styled.a`
  color: ${(props) => props.theme.colors.textMain};
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  margin-top: 10px;
  gap: 3px;
  width: 100%;
  justify-content: center;
  img {
    margin-left: 5px;
  }
`;
