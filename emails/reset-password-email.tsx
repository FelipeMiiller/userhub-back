import {
 

  Button,
  Container,
  Head,

  Html,

  Preview,

  Text,
} from '@react-email/components';

interface ResetPasswordEmailProps {
  userFirstname: string;
  userEmail: string;
  newPassword: string;
  siteUrl: string;
}

 const ResetPasswordEmail = ({
  userFirstname = 'Usuário',
  userEmail = 'email@userhub.com',
  newPassword = 's3nh4-4l3at0r14',
  siteUrl = 'https://google.com.br',
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head/>
      <Preview>Redefinição de Senha - UserHub</Preview>
 
     
      <Container style={container}>
        <Text style={title}>Nova Senha Gerada</Text>
        <Text style={paragraph}>Olá {userFirstname},</Text>
        <Text style={paragraph}>
          Foi gerada uma nova senha para a sua conta. Utilize as credenciais abaixo para fazer login:
        </Text>
        <Button href={siteUrl} style={button}>
          <strong>E-mail:</strong> {userEmail}
          <br />
          <strong>Nova Senha:</strong> {newPassword}
        </Button>
        <Text style={paragraph}>
          <strong>Importante:</strong> Recomendamos que você altere esta senha após o primeiro acesso nas configurações da sua conta.
        </Text>
        <Text style={paragraph}>
          Se você não solicitou uma nova senha, entre em contato imediatamente com o suporte.
        </Text>
        <Text style={paragraph}>
          Atenciosamente,
          <br />
          Equipe UserHub
        </Text>
      </Container>
    </Html>
  );
};
export default ResetPasswordEmail;
const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
  lineHeight: '1.6',
  color: '#333',
};

const title = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '20px',
  color: '#0a0a0a',
};

const paragraph = {
  margin: '15px 0',
  fontSize: '16px',
};

const button = {
  backgroundColor: '#0a0a0a',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'start' as const,
  display: 'block',
  padding: '12px',
};

const link = {
  color: '#fff',
  wordBreak: 'break-all',
};
