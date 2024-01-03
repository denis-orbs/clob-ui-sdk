import styled from "styled-components";
export function Logo({ src, className }: { src?: string; className?: string }) {
  return (
    <Container className={className}>
      <img src={src} />
    </Container>
  );
}

const Container = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
  }
`;
