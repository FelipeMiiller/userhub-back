import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';


interface WelcomeEmailProps {
  userFirstname: string;
  siteUrl: string;
}

export const WelcomeEmail = ({ userFirstname = 'Usuário', siteUrl = 'https://google.com.br' }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Bem-vindo ao UserHub - Sua plataforma de gerenciamento de usuários
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={paragraph}>Olá {userFirstname},</Text>
        <Text style={paragraph}>
          Seja bem-vindo ao UserHub! Estamos muito felizes por você ter se juntado a nós.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={siteUrl}>
            Acessar Plataforma
          </Button>
        </Section>
        <Text style={paragraph}>
          Se precisar de ajuda, não hesite em entrar em contato com nosso suporte.
        </Text>
        <Text style={paragraph}>
          Atenciosamente,
          <br />
          Equipe UserHub
        </Text>
        <Hr style={hr} />
        <Text style={footer}>UserHub - Todos os direitos reservados</Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#0a0a0a',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  textAlign: 'center' as const,
};

export default WelcomeEmail;