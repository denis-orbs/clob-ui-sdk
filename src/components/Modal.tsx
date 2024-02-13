/* eslint-disable import/no-extraneous-dependencies */
import Popup from "reactjs-popup";
import { FlexColumn, FlexRow, Text } from "../styles";
import styled, { useTheme, keyframes } from "styled-components";
import { X } from "react-feather";
import { CSSProperties, ReactNode } from "react";

export function Modal({
  title,
  open,
  onClose,
  children,
  contentStyles = {},
  headerStyles = {},
}: {
  title: string;
  open?: boolean;
  onClose: () => void;
  children: ReactNode;
  contentStyles?: CSSProperties;
  headerStyles?: CSSProperties;
}) {
  const theme = useTheme();

  return (
    <StyledPopup
      closeOnDocumentClick={false}
      open={open}
      position="right center"
      overlayStyle={{
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(10px)",
        zIndex: 99999,
        padding: "18px",
      }}
      contentStyle={{
        borderRadius: "20px",
        padding: "20px",
        boxSizing: "border-box",
        position: "relative",
        width: "100%",
        fontFamily: "inherit",
        transition: "all 0.3s ease-in-out",
        background: theme.colors.mainBackground,
        border: `1px solid ${theme.colors.border}`,
        ...contentStyles,
      }}
    >
      <FlexColumn $gap={30}>
        <FlexRow>

            <StyledHeader style={headerStyles}>
              {title && <StyledTitle>{title}</StyledTitle>}
              {onClose && (
                <CloseButton onClick={onClose}>
                  <X />
                </CloseButton>
              )}
            </StyledHeader>

        </FlexRow>
        {children}
      </FlexColumn>
    </StyledPopup>
  );
}

const StyledTitle = styled(Text)`
  font-size: 20px;
`

const animation = keyframes`
     0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
`;

const StyledPopup = styled(Popup)`
  position: relative;
  &-content {
    -webkit-animation: ${animation} 0.3s forwards;
    animation: ${animation} 0.3s forwards;
  }

  &-overlay {
    -webkit-animation: ${animation} 0.3s forwards;
    animation: ${animation} 0.3s forwards;
  }
`;


const StyledHeader = styled(FlexRow)`
  width: 100%;
`;

const CloseButton = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  cursor: pointer;
  color: ${(props) => props.theme.colors.textMain};
`;
