/* eslint-disable import/no-extraneous-dependencies */
import Popup from "reactjs-popup";
import { FlexColumn, FlexRow, Text } from "../styles";
import styled, { useTheme } from "styled-components";
import { X } from "react-feather";
import { ReactNode } from "react";

export function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  console.log(theme);

  return (
    <Popup
      closeOnDocumentClick={false}
      open={open}
      position="right center"
      contentStyle={{
        borderRadius: "20px",
        padding: "20px",
        boxSizing: "border-box",
        position: "relative",
        maxWidth: "400px",
        width: "100%",
        fontFamily: "inherit",
        transition: "all 0.3s ease-in-out",
        background: theme.colors.mainBackground,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <FlexColumn $gap={30}>
        <FlexRow>
          {title && <Header>{title}</Header>}
          <CloseButton onClick={onClose}>
            <X />
          </CloseButton>
        </FlexRow>
        {children}
      </FlexColumn>
    </Popup>
  );
}



const Header = ({ children }: { children: string }) => {
  return <StyledHeader>{children}</StyledHeader>;
};

const StyledHeader = styled(Text)`
  width: 100%;
`;




const CloseButton = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  cursor: pointer;
  color: ${(props) => props.theme.colors.textMain};
`;
