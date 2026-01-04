import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlaceholderProps {
  pageName: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ pageName }) => {
  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>{pageName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a placeholder page for {pageName}.</p>
          <p>Functionality for this page will be implemented in the future.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Placeholder;
