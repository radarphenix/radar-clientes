import React from 'react';
import MenuFeira from './MenuFeira.jsx';
import CadastroProdutos from './CadastroProdutos.jsx';
import FormularioPromocao from './FormularioPromocao.jsx';
import StatusFilaFeira from './StatusFilaFeira.jsx';
import { iniciarFila } from './filaCadastroProdutos';
import { recarregarSeAtualizado } from './atualizacaoApp.js';
import './feira-veste-phenix.css';

export default function FeiraVestePhenix(){
 const[tela,setTela]=React.useState('menu');
 // Cadastros de produtos guardados sem internet são enviados em segundo plano, em qualquer tela.
 React.useEffect(()=>{iniciarFila()},[]);
 // O menu é um momento seguro para aplicar uma versão nova do app.
 React.useEffect(()=>{if(tela==='menu')recarregarSeAtualizado()},[tela]);
 const conteudo=tela==='promocao'?<><button className="retorno-flutuante" onClick={()=>setTela('menu')}>Voltar ao menu</button><FormularioPromocao modoStand/></>
  :tela==='cadastro'?<CadastroProdutos voltarMenu={()=>setTela('menu')}/>
  :<MenuFeira abrirPromocao={()=>setTela('promocao')} abrirCadastro={()=>setTela('cadastro')}/>;
 return <div className="feira-veste-phenix">{conteudo}<StatusFilaFeira/></div>;
}
