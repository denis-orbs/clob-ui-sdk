import { ReactNode } from "react";
import styled from "styled-components";
import { useLHContext } from "../lib/provider";
import { Spinner } from "./Spinner";
export function Button({
  children,
  className = "className",
  onClick,
  isLoading
}: {
  children: ReactNode;
  className?: string;
  onClick: () => void;
    isLoading?: boolean;
}) {
      const { uiSettings } = useLHContext();

  return (
    <Container
      $bg={uiSettings?.buttonColor}
      onClick={onClick}
      className={className}
    >
      <div style={{ opacity: isLoading ? 0 : 1 }}>{children}</div>
      {isLoading && <Spinner />}
    </Container>
  );
}

const Container = styled.button<{ $bg?: string; $hoverBg?: string }>`
  font-size: 15px;
  font-weight: 600;
  min-height: 50px;
  background: ${({ theme, $bg }) => $bg || theme.colors.primary};
  color: ${(props) => props.theme.colors.textMain};
  border: none;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.3s;
`;
