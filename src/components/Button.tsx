import { ReactNode } from "react";
import styled from "styled-components";
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
  return (
    <Container onClick={onClick} className={className}>
      <div style={{ opacity: isLoading ? 0 : 1 }}>{children}</div>
      {isLoading && <Spinner />}
    </Container>
  );
}

const Container = styled.button`
  font-size: 15px;
  font-weight: 600;
  min-height: 50px;
  background: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.textMain};
  border: none;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.3s;
  &:hover {
    background: ${(props) => props.theme.colors.primaryDark};
  }
`;
