import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-jwt-ultra-segura-de-al-menos-32-caracteres-muy-larga-y-compleja-2024';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token?.value) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar y decodificar el token
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token.value, secret)
    const decoded = payload as any;

    // Obtener información actualizada del usuario
    const query = `
      SELECT id, email, nombre, apellido, rol, activo 
      FROM usuarios 
      WHERE id = ? AND activo = TRUE
    `;
    const result = await executeQuery(query, [decoded.userId]) as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const usuario = result[0];

    return NextResponse.json({
      success: true,
      user: usuario
    });

  } catch (error) {
    console.error('Error verificando autenticación:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
