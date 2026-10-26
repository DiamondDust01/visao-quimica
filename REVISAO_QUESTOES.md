# Revisão do banco de questões

## Rodada de 2026-10-26

Revisão das 477 questões, feita por um assistente de IA (Claude), sem professor de Química. Por
isso todas continuam com `"revisado": false`. Esse campo fica reservado para a revisão de um
professor, que esta rodada não substitui.

### O que foi conferido em cada questão

- Gabarito: se a alternativa ou resposta marcada é a correta e se nenhuma outra também serve.
- Dados químicos: massas, constantes (Ka, Kps, potenciais-padrão, entalpias), temperaturas de
  ebulição, pressões de vapor, cores de chama, faixas do infravermelho, limites de potabilidade.
- Resolução passo a passo, dica e erros comuns: precisão, coerência com o gabarito e linguagem.
- Segurança: orientações de laboratório e ausência de procedimentos perigosos.

As contas já eram conferidas por `npm run validate:content`, que recalcula cada resposta numérica
pela expressão `verificacao` e confere balanceamentos, fórmulas e estruturas.

### Resultado

Nenhum gabarito errado e nenhuma conta errada. Oito textos foram corrigidos ou completados:

| Questão | Campo | Mudança |
|---|---|---|
| `fund-separacao-homogeneas-q2` | resolução | Nota sobre a mistura azeotrópica água-etanol (a destilação fracionada chega a cerca de 96% de etanol). |
| `atom-modelos-classicos-q1` | resolução | Thomson descobriu o elétron em 1897, mas propôs o modelo em 1904. |
| `atom-modelos-classicos-q3` | resolução | Mesma correção de data. |
| `tab-historia-q2` | erros comuns | "Nenhum gás nobre tinha sido isolado" em 1869 (o hélio já fora observado no espectro do Sol). |
| `tab-raio-atomico-q2` | erros comuns | Tirada a afirmação de que o argônio é "o menor do período", que depende da definição de raio usada. |
| `gas-volume-molar-q1` | resolução | Nota: a IUPAC usa hoje 1 bar como pressão padrão (cerca de 22,7 L/mol); a questão segue com 22,4 L/mol (CNTP, 1 atm). |
| `gas-variaveis-estado-q3` | resolução | "Zero absoluto, a menor temperatura possível" no lugar de "ausência de agitação térmica". |
| `lab-vidrarias-q3` | resolução | "Ambientação" (enxaguar com o próprio líquido) no lugar do anglicismo "rinsada". |

### O que ainda pede um professor

- Adequação de cada questão à etapa e à dificuldade indicadas, com base na prática em sala.
- Convenções escolares que variam entre livros e redes de ensino (por exemplo, "subnível mais
  energético" pelo diagrama de Linus Pauling, CNTP com 1 atm, nomes aceitos na nomenclatura).
- Ampliar para 5 questões por subtema, como planejado.
