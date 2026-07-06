import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function SessionEnd() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card variant="gray-dark" padding="xl" className="max-w-md w-full">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-success" strokeWidth={1.5} />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Sessão encerrada</h1>
            <p className="text-text-primary/60 text-sm mt-1">
              A sessão de performance foi finalizada com sucesso.
            </p>
          </div>

          <Button 
            variant="primary" 
            size="md"
            onClick={() => navigate('/')}
            className="mt-2"
          >
            Voltar ao início
          </Button>
        </div>
      </Card>
    </div>
  );
}