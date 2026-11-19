import { useEffect } from 'react';

// Leva a tela até a seção pedida pelo menu (ex.: Perfil → Backup) e põe o foco nela, para
// leitores de tela anunciarem onde o estudante chegou. A seção é o elemento com id
// `${prefixo}-${secao}` e precisa de tabIndex={-1}.
export default function useSectionFocus(prefixo, secao) {
  useEffect(() => {
    if (!secao) return undefined;
    // Espera o App terminar a troca de tela (ele põe o foco no conteúdo principal).
    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(`${prefixo}-${secao}`);
      if (!element) return;
      element.scrollIntoView({ block: 'start' });
      element.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [prefixo, secao]);
}
