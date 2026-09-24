import React from 'react';
import MenuFeira from './MenuFeira.jsx';
import CadastroProdutos from './CadastroProdutos.jsx';
import FormularioPromocao from './FormularioPromocao.jsx';
import './feira-veste-phenix.css';

export default function FeiraVestePhenix(){
 const[tela,setTela]=React.useState('menu');
 if(tela==='promocao')return <div className="feira-veste-phenix"><button className="retorno-flutuante" onClick={()=>setTela('menu')}>Voltar ao menu</button><FormularioPromocao/></div>;
 if(tela==='cadastro')return <div className="feira-veste-phenix"><CadastroProdutos voltarMenu={()=>setTela('menu')}/></div>;
 return <div className="feira-veste-phenix"><MenuFeira abrirPromocao={()=>setTela('promocao')} abrirCadastro={()=>setTela('cadastro')}/></div>;
}
