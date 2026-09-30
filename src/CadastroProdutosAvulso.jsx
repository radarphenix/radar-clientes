import React from 'react';
import CadastroProdutos from './CadastroProdutos.jsx';
import StatusFilaFeira from './StatusFilaFeira.jsx';
import { iniciarFila } from './filaCadastroProdutos';
import './feira-veste-phenix.css';

// Link direto para vendedores: só o cadastro de produtos, sem o menu da feira
// (e portanto sem acesso à promoção).
export default function CadastroProdutosAvulso(){
 React.useEffect(()=>{iniciarFila()},[]);
 return <div className="feira-veste-phenix"><CadastroProdutos/><StatusFilaFeira/></div>;
}
