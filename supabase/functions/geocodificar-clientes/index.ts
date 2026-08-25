import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function aguardar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function limparEndereco(texto: string) {
  return String(texto || "")
    .trim()
    .replace(/^R\s+/i, "Rua ")
    .replace(/^R\.\s+/i, "Rua ")
    .replace(/^AV\s+/i, "Avenida ")
    .replace(/^AV\.\s+/i, "Avenida ")
    .replace(/^EST\.\s+/i, "Estrada ");
}

function montarEnderecoBusca(cliente: any) {
  const endereco = limparEndereco(cliente.endereco || "");
  const numero = String(cliente.numero || "").trim();
  const cidade = String(cliente.cidade || "").trim();
  const uf = String(cliente.uf || "").trim();

  return `${endereco} ${numero}, ${cidade}, ${uf}, Brasil`
    .replace(/\s+/g, " ")
    .trim();
}

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: pendentes, error } = await supabase
      .from("clientes_geolocalizacao")
      .select(`
        codigo_cliente,
        endereco_chave,
        latitude,
        longitude
      `)
      .is("latitude", null)
      .is("longitude", null)
      .limit(20);

    if (error) throw error;

    let processados = 0;
    let sucesso = 0;
    let falha = 0;

    for (const geo of pendentes || []) {
      try {
        const { data: cliente, error: erroCliente } = await supabase
          .from("clientes")
          .select(`
            codigo_cliente,
            endereco,
            numero,
            cidade,
            uf
          `)
          .eq("codigo_cliente", geo.codigo_cliente)
          .single();

        if (erroCliente || !cliente) {
          await supabase
            .from("clientes_geolocalizacao")
            .update({
              erro_geocodificacao: "Cliente não encontrado na tabela clientes",
              geolocalizacao_pendente: true,
              updated_at: new Date().toISOString(),
            })
            .eq("codigo_cliente", geo.codigo_cliente);

          falha++;
          processados++;
          continue;
        }

        const tentativas = [
          montarEnderecoBusca(cliente),
          `${cliente.cidade || ""}, ${cliente.uf || ""}, Brasil`,
        ];

        let encontrado = null;

        for (const endereco of tentativas) {
          if (!endereco || endereco.trim().length < 5) continue;

          const url =
            "https://nominatim.openstreetmap.org/search?" +
            new URLSearchParams({
              q: endereco,
              format: "json",
              limit: "1",
            });

          const response = await fetch(url, {
            headers: {
              "Accept": "application/json",
              "User-Agent": "RadarClientesPhenix/1.0",
            },
          });

          if (!response.ok) {
            await aguardar(1200);
            continue;
          }

          const resultado = await response.json();

          if (Array.isArray(resultado) && resultado.length > 0) {
            encontrado = {
              latitude: Number(resultado[0].lat),
              longitude: Number(resultado[0].lon),
              endereco_usado: endereco,
            };

            break;
          }

          await aguardar(1200);
        }

        if (encontrado) {
          await supabase
            .from("clientes_geolocalizacao")
            .update({
              latitude: encontrado.latitude,
              longitude: encontrado.longitude,
              geocodificado_em: new Date().toISOString(),
              geolocalizacao_pendente: false,
              erro_geocodificacao: null,
              updated_at: new Date().toISOString(),
            })
            .eq("codigo_cliente", geo.codigo_cliente);

          sucesso++;
        } else {
          await supabase
            .from("clientes_geolocalizacao")
            .update({
              erro_geocodificacao: "Endereço não localizado",
              geolocalizacao_pendente: true,
              updated_at: new Date().toISOString(),
            })
            .eq("codigo_cliente", geo.codigo_cliente);

          falha++;
        }

        processados++;

        await aguardar(1200);
      } catch (erroInterno) {
        await supabase
          .from("clientes_geolocalizacao")
          .update({
            erro_geocodificacao: String(erroInterno),
            geolocalizacao_pendente: true,
            updated_at: new Date().toISOString(),
          })
          .eq("codigo_cliente", geo.codigo_cliente);

        falha++;
        processados++;
      }
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        processados,
        sucesso_geocodificacao: sucesso,
        falha_geocodificacao: falha,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (erro) {
    return new Response(
      JSON.stringify({
        sucesso: false,
        erro: String(erro),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});