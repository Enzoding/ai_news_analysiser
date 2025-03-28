import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 获取单个新闻源
export async function GET(request: NextRequest) {
  try {
    // 从 URL 中提取 id 参数
    const id = request.nextUrl.pathname.split('/').pop() || '';
    
    const { data, error } = await supabase
      .from('news_sources')
      .select('*')
      .eq('id', id)
      .single();
    
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

// 更新新闻源
export async function PUT(request: NextRequest) {
  try {
    // 从 URL 中提取 id 参数
    const id = request.nextUrl.pathname.split('/').pop() || '';
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
      .update({ name, url, type })
      .eq('id', id)
      .select();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('更新新闻源失败:', error);
    return NextResponse.json(
      { success: false, error: '更新新闻源失败' },
      { status: 500 }
    );
  }
}

// 删除新闻源
export async function DELETE(request: NextRequest) {
  try {
    // 从 URL 中提取 id 参数
    const id = request.nextUrl.pathname.split('/').pop() || '';
    
    const { error } = await supabase
      .from('news_sources')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除新闻源失败:', error);
    return NextResponse.json(
      { success: false, error: '删除新闻源失败' },
      { status: 500 }
    );
  }
}
