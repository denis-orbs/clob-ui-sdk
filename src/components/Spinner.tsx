import styled from "styled-components";
const StyledSpinner = styled.div<{
  $size?: number;
  $borderWidth?: number;
}>`
    width: ${({ $size }) => $size || 38}px;
    height: ${({ $size }) => $size || 38}px;
    border: ${({ $borderWidth }) => $borderWidth || 4}px solid
        ${({ theme }) => theme.colors.textMain || "black"};
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
`;

export const Spinner = ({
  className = "",
  size,
  borderWidth,
}: {
  className?: string;
  size?: number;
  borderWidth?: number;
}) => {
  return (
    <StyledSpinner
      className={className}
      $size={size}
      $borderWidth={borderWidth}
    />
  );
};
