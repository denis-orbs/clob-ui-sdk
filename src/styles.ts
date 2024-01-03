import styled from "styled-components";

export const FlexRow = styled.div<{
  $gap?: number;
  $alignItems?: string;
  $justifyContent?: string;
}>`
  display: flex;
  flex-direction:  row;
  align-items: ${({ $alignItems }) => $alignItems || "center"};
  gap: ${({ $gap }) => $gap || 10}px;
    justify-content: ${({ $justifyContent }) => $justifyContent || "center"};
`;
export const FlexColumn = styled.div<{ $gap?: number; $alignItems?: string }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $alignItems }) => $alignItems || "flex-start"};
  gap: ${({ $gap }) => $gap || 10}px;
`;

export const Text = styled.p`
  color: ${({ theme }) => theme.colors.textMain};
`

export const Link = styled.a`
  color: ${({ theme }) => theme.colors.linkMain};
  text-decoration: none;
`