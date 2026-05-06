import torch
import torch.nn as nn
import timm

class OncoTriageModel(nn.Module):
    def __init__(self, num_classes=2, dropout_rate=0.3):
        super().__init__()
        # Cargamos B4. 'pretrained=True' es clave para transfer learning con el dataset de Kermany.
        self.model = timm.create_model('efficientnet_b4', pretrained=True, num_classes=num_classes)
        
        # Accedemos al dropout de la capa classifier para habilitar MC Dropout
        self.dropout_rate = dropout_rate

    def forward(self, x, mc_dropout=False):
        """
        Si mc_dropout es True, forzamos al modelo a mantener el Dropout activo 
        incluso en modo de evaluación (.eval()).
        """
        if mc_dropout:
            # Activamos solo las capas de dropout
            for m in self.modules():
                if isinstance(m, nn.Dropout):
                    m.train()
        
        return self.model(x)

    def predict_with_uncertainty(self, x, n_iter=10):
        """
        Realiza T inferencias estocásticas para calcular la media y la varianza (Incertidumbre).
        """
        outputs = torch.stack([torch.softmax(self.forward(x, mc_dropout=True), dim=1) for _ in range(n_iter)])
        
        # Promedio de las predicciones (Probabilidad final)
        mean_output = outputs.mean(0)
        
        # Variación entre predicciones (Incertidumbre Epistémica)
        uncertainty = outputs.std(0)
        
        return mean_output, uncertainty