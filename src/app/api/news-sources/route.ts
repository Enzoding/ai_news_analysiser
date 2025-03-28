import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 获取所有新闻源
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('news_sources')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取新闻源失败:', error);
    return NextResponse.json(
      { success: false, error: '获取新闻源失败' },
      { status: 500 }
    );
  }
}

// 添加新闻源
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, type } = body;
    
    if (!name || !url || !type) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('news_sources')
      .insert([{ name, url, type }])
      .select();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('添加新闻源失败:', error);
    return NextResponse.json(
      { success: false, error: '添加新闻源失败' },
      { status: 500 }
    );
  }
}
