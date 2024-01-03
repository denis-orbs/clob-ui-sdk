import styled from "styled-components";
export const OrbsLogo = ({
  width = 20,
  height = 20,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => {
  return (
    <StyledOrbsLogo
      className={className}
      style={{ width, height }}
      alt="Orbs logo"
      src="https://www.orbs.com/assets/img/common/logo.svg"
    />
  );
};

const StyledOrbsLogo = styled("img")`
  objectfit: contain;
  display: inline;
`;
