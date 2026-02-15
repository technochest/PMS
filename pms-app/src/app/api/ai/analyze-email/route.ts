/**
 * AI Email Analysis API Route
 * POST /api/ai/analyze-email
 * 
 * Analyzes email content using AWS Comprehend.
 * All AWS calls are server-side only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeEmail, analyzeEmailBatch, type EmailAnalysisInput } from '@/lib/aws/comprehend';

interface AnalyzeEmailRequest {
  email?: EmailAnalysisInput;
  emails?: EmailAnalysisInput[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeEmailRequest = await request.json();
    
    // Validate input
    if (!body.email && !body.emails) {
      return NextResponse.json(
        { error: 'Either "email" or "emails" must be provided' },
        { status: 400 }
      );
    }
    
    // Single email analysis
    if (body.email) {
      if (!body.email.subject || !body.email.body || !body.email.from) {
        return NextResponse.json(
          { error: 'Email must have subject, body, and from fields' },
          { status: 400 }
        );
      }
      
      const result = await analyzeEmail(body.email);
      
      return NextResponse.json({
        success: true,
        result,
      });
    }
    
    // Batch email analysis
    if (body.emails) {
      if (!Array.isArray(body.emails) || body.emails.length === 0) {
        return NextResponse.json(
          { error: 'emails must be a non-empty array' },
          { status: 400 }
        );
      }
      
      // Limit batch size to prevent timeout
      if (body.emails.length > 50) {
        return NextResponse.json(
          { error: 'Maximum batch size is 50 emails' },
          { status: 400 }
        );
      }
      
      // Validate each email
      for (let i = 0; i < body.emails.length; i++) {
        const email = body.emails[i];
        if (!email.subject || !email.body || !email.from) {
          return NextResponse.json(
            { error: `Email at index ${i} must have subject, body, and from fields` },
            { status: 400 }
          );
        }
      }
      
      const results = await analyzeEmailBatch(body.emails);
      
      return NextResponse.json({
        success: true,
        results,
        count: results.length,
      });
    }
    
    // Should not reach here
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Email analysis error:', error);
    
    // Check for AWS credential errors
    if (error instanceof Error && error.name === 'CredentialsProviderError') {
      return NextResponse.json(
        { 
          error: 'AWS credentials not configured',
          details: 'Ensure the EC2 instance has the proper IAM role attached',
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
